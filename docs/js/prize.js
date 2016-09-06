$(function() {
  var localStorageManager = new LocalStorageManager();
  $('.card .card-title').each(function(_, v) {
    var title = $(v).children('h4').text();
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
