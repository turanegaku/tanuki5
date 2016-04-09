$(function() {
  var localStorageManager = new LocalStorageManager();
  $('.box>h1').each(function(_, v) {
    var title = $(v).text();
    localStorageManager.open(title);
    var prize = localStorageManager.getValue(title, 'prize');
    switch (prize) {
      case 1:
        $(v).children('.prize').append('♛');
        break;
      case 2:
        $(v).children('.prize').append('♚');
        break;
      default:
    }
  });
});
