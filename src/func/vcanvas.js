paper.install(window);
window.onload = function() {
    paper.setup('canvas');
    var vc = $("#vc")[0];
    vc.onclick = function() {
        var path = new Path();
        path.strokeColor = 'black';
        var start = new Point(100, 100);
        path.moveTo(start);
        path.lineTo(start.add([ 200, -50 ]));
        view.draw();
    }
}
