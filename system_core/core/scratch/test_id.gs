function testCreate() {
  var ss = SpreadsheetApp.create("TEST_ID_FORMAT");
  console.log("ID: " + ss.getId());
  console.log("Length: " + ss.getId().length);
}
