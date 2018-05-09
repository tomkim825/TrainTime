// Initialize Firebase and global variables
var config = {
    apiKey: "AIzaSyDthWXf09-j1XVov5eXVqt_W_kCNLcUnFg",
    authDomain: "traintime-c6b27.firebaseapp.com",
    databaseURL: "https://traintime-c6b27.firebaseio.com",
    projectId: "traintime-c6b27",
    storageBucket: "",
    messagingSenderId: "468518214637"
};
firebase.initializeApp(config);

var database = firebase.database();
var currentTime = moment();
var trainName;
var trainDestination;
var trainTime;
var trainFrequency;
var firstTimeConverted;
var diffTime;
var tRemainder;
var tMinutesTillTrain;
var nextTrain;
var trainId;
var rowID=0;

// display current time on card header every 15 sec with setInterval

function updateTime() {
    var currentTime = moment().format('hh:mm A');
    $('#currentTime').text(currentTime);
};    

updateTime();

function timeCalculations() {
    // First Time (pushed back 1 year to make sure it comes before current time)
    firstTimeConverted = moment(trainTime, "HH:mm").subtract(1, "years");
    // Difference between the times
    diffTime = moment().diff(moment(firstTimeConverted), "minutes");
    // Time apart (remainder)
    tRemainder = diffTime % trainFrequency;
    // Minute Until Train
    tMinutesTillTrain = trainFrequency - tRemainder;
    // Next Train
    nextTrain = moment().add(tMinutesTillTrain, "minutes").format('hh:mm a');    
};

// create function to be called later
function fillOutTrainTable(){
    timeCalculations();
    var newTableRow = $('<tr>');
    $('<td>').text(trainName).appendTo(newTableRow).attr('data-name',trainName).addClass('nameRow'+rowID);
    $('<td>').text(trainDestination).appendTo(newTableRow).attr('data-destination',trainDestination).addClass('destinationRow'+rowID);
    $('<td>').text(trainFrequency).appendTo(newTableRow).attr('data-frequency',trainFrequency).addClass('frequencyRow'+rowID);
    $('<td>').text(nextTrain).appendTo(newTableRow);
    $('<td>').text(tMinutesTillTrain).appendTo(newTableRow);
    var newButtonEdit = $('<button>');
    newButtonEdit.addClass('btn btn-primary editTrain').text('edit').attr('id',trainId).attr('data-row',rowID);
    var newButtonRemove= $('<button>');
    newButtonRemove.addClass('btn btn-danger removeTrain').text('remove').attr('id',trainId);
    $('<td>').append(newButtonEdit).append(newButtonRemove).appendTo(newTableRow);
    newTableRow.appendTo('#tableBody');
    rowID++;
};

// firebase database updates global variables on 'child_added'
function firebaseUpdate() {
    database.ref().orderByChild("name").on("child_added", function(snapshot) {
        trainName = snapshot.val().name;
        trainDestination = snapshot.val().destination;
        trainTime = snapshot.val().time;
        trainFrequency = snapshot.val().frequency;
        nextTrain = snapshot.val().next;
        tMinutesTillTrain = snapshot.val().min;
        trainId = snapshot.key;
        fillOutTrainTable();
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

firebaseUpdate();
setInterval(function(){
    $('#tableBody').empty();
    firebaseUpdate();
    updateTime();
}, 1000);


$(document).on("click", '#submit', function(event) {
    event.preventDefault();
    console.log('clicked');
    trainName = $("#trainName").val().trim();
    trainDestination = $("#trainDestination").val().trim();
    trainTime = $("#trainTime").val().trim();
    trainFrequency = $("#trainFrequency").val().trim();
    //checks if each input has a value
    if (trainName === "") {alert('Which train is it? (Train name is missing)')};
    if (trainDestination === "") {alert('Where is the train going (Destination missing)')};
    if (trainTime === "") {alert('When is the first train time?')};
    if (trainFrequency === "") {alert('Please enter how often the train comes')};
    timeCalculations();
    var newTrain = {
        name: trainName,
        destination: trainDestination,
        time: trainTime,
        frequency: trainFrequency,
        min: tMinutesTillTrain,
        next: nextTrain
    }
    // fillOutTrainTable() ; //<-- this might be redundant if firebase child added part works
    database.ref().push({
        name: trainName,
        destination: trainDestination,
        time: trainTime,
        frequency: trainFrequency,
        min: tMinutesTillTrain,
        next: nextTrain
    });
    $("#trainName").val('');
    $("#trainDestination").val('');
    $("#trainTime").val('');
    $("#trainFrequency").val('');
    $('#tableBody').empty();
});

$(document).on("click", '.removeTrain', function(event) {
    database.ref().child(this.id).remove();
});

$(document).on("click", '.editTrain', function(event) {
    var rowNum = $(this).data("row");
    var editName = $('.nameRow'+rowNum).data("name");
    var editDestination = $('.destinationRow'+rowNum).data("destination");
    var editFrequency = $('.frequencyRow'+rowNum).data("frequency");
    var editNext = $('.nextRow'+rowNum).data("next");
    $("#trainName").val(editName);
    $("#trainDestination").val(editDestination);
    $("#trainFrequency").val(editFrequency);
    database.ref().child(this.id).remove();
});
