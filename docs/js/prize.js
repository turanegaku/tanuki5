addEventListener('DOMContentLoaded', function () {
  var marks = {1: '♛', 2: '♚'};
  document.querySelectorAll('.card .card-title').forEach(function (card) {
    var mark = marks[loadGame(card.querySelector('h4').textContent).prize];
    if (mark) card.querySelector('.prize').textContent = mark;
  });
});
