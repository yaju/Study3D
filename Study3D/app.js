// Class Point
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
})();

// 頂点クラス
var Vertex = (function () {
    function Vertex(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.rx = 0;
        this.ry = 0;
        this.rz = 0;
        this.screenX = 0;
        this.screenY = 0;
    }
    return Vertex;
})();

// 面クラス
var Face = (function () {
    function Face(v0, v1, v2) {
        this.v = [];
        this.z = 0;
        this.nx = 0;
        this.ny = 0;
        this.nz = 0;
        this.v.push(v0);
        this.v.push(v1);
        this.v.push(v2);
    }
    return Face;
})();

var Study3DApp = (function () {
    function Study3DApp(canvas) {
        var _this = this;
        // 頂点データ
        this.VERTEX_DATA = [
            [-1, 0, 0], [0, 1, 0], [0, 0, -1],
            [1, 0, 0], [0, 0, 1], [0, -1, 0]];
        // 面データ
        this.FACE_DATA = [
            [1, 4, 2], [1, 0, 4], [1, 2, 0], [3, 2, 4],
            [0, 5, 4], [4, 5, 3], [3, 5, 2], [2, 5, 0]];
        this.vertices = [];
        this.faces = [];
        this.phi = 0.20;
        this.theta = -0.38;
        this.isDrag = false;
        this.context = canvas.getContext("2d");
        this.width = canvas.width = 448; //window.innerWidth;
        this.height = canvas.height = 448; //window.innerHeight;
        this.mousePosition = new Point(this.width / 2, this.height / 2);
        this.center = new Point(this.width / 2, this.height / 2);

        // 描画スケールの設定
        this.scale = this.width * 0.8 / 2;

        canvas.addEventListener("mousemove", function (e) {
            if (!_this.isDrag)
                return;

            // 回転角の更新
            _this.theta += (e.clientX - _this.mousePosition.x) * 0.01;
            _this.phi += (e.clientY - _this.mousePosition.y) * 0.01;

            // x軸周りの回転角に上限を設定
            _this.phi = Math.min(_this.phi, Math.PI / 2);
            _this.phi = Math.max(_this.phi, -Math.PI / 2);

            // マウス位置の更新
            _this.mousePosition = new Point(e.clientX, e.clientY);

            // 頂点のスクリーン座標の更新
            _this.setScreenPosition();

            // 描画
            _this.drawModel();
        });

        canvas.addEventListener("mousedown", function (e) {
            // マウスボタン押下イベント
            _this.isDrag = true;

            // マウス位置の更新
            _this.mousePosition = new Point(e.clientX, e.clientY);
        });
        canvas.addEventListener("mouseup", function (e) {
            // マウスボタン離されたイベント
            _this.isDrag = false;
        });

        // モデルデータの設定
        this.setModelData();

        // 頂点のスクリーン座標の更新
        this.setScreenPosition();

        // 描画
        this.drawModel();
    }
    // モデルデータの設定
    Study3DApp.prototype.setModelData = function () {
        for (var i = 0; i < this.VERTEX_DATA.length; i++) {
            this.vertices.push(new Vertex(this.VERTEX_DATA[i][0], this.VERTEX_DATA[i][1], this.VERTEX_DATA[i][2]));
        }

        for (var i = 0; i < this.FACE_DATA.length; i++) {
            this.faces.push(new Face(this.vertices[this.FACE_DATA[i][0]], this.vertices[this.FACE_DATA[i][1]], this.vertices[this.FACE_DATA[i][2]]));
        }
    };

    // 頂点のスクリーン座標を更新する
    Study3DApp.prototype.setScreenPosition = function () {
        for (var i = 0; i < this.vertices.length; i++) {
            var v = this.vertices[i];

            // 回転後の座標値の算出
            v.rx = v.x * Math.cos(this.theta) + v.z * Math.sin(this.theta);
            v.ry = v.x * Math.sin(this.phi) * Math.sin(this.theta) + v.y * Math.cos(this.phi) - v.z * Math.sin(this.phi) * Math.cos(this.theta);
            v.rz = -v.x * Math.cos(this.phi) * Math.sin(this.theta) + v.y * Math.sin(this.phi) + v.z * Math.cos(this.phi) * Math.cos(this.theta);

            // スクリーン座標の算出
            v.screenX = this.center.x + this.scale * v.rx;
            v.screenY = this.center.y - this.scale * v.ry;
        }

        for (var i = 0; i < this.faces.length; i++) {
            var face = this.faces[i];

            // 面の奥行き座標を更新
            face.z = 0.0;
            for (var j = 0; j < 3; j++) {
                face.z += face.v[j].rz;
            }

            // 2辺のベクトルを計算
            var v1_v0_x = face.v[1].rx - face.v[0].rx;
            var v1_v0_y = face.v[1].ry - face.v[0].ry;
            var v1_v0_z = face.v[1].rz - face.v[0].rz;
            var v2_v0_x = face.v[2].rx - face.v[0].rx;
            var v2_v0_y = face.v[2].ry - face.v[0].ry;
            var v2_v0_z = face.v[2].rz - face.v[0].rz;

            // 法線ベクトルを外積から求める
            face.nx = v1_v0_y * v2_v0_z - v1_v0_z * v2_v0_y;
            face.ny = v1_v0_z * v2_v0_x - v1_v0_x * v2_v0_z;
            face.nz = v1_v0_x * v2_v0_y - v1_v0_y * v2_v0_x;

            // 法線ベクトルの正規化
            var l = Math.sqrt(face.nx * face.nx + face.ny * face.ny + face.nz * face.nz);
            face.nx /= l;
            face.ny /= l;
            face.nz /= l;
        }

        // 面を奥行き座標で並び替える
        this.faces.sort(function (a, b) {
            return a["z"] - b["z"];
        });
    };

    //３点が時計回りかどうかを調べる
    //時計回りなら１，反時計回りで-1、直線で０を返す。
    Study3DApp.prototype.isFace = function (p1, p2, p3) {
        var result = 0;
        var dx2;
        var dy2;
        var dx3;
        var dy3;

        dx2 = p2.x - p1.x;
        dy2 = p2.y - p1.y;
        dx3 = p3.x - p1.x;
        dy3 = p3.y - p1.y;

        if ((dx2 * dy3) > (dx3 * dy2))
            result = -1;
        else if ((dx2 * dy3) < (dx3 * dy2))
            result = 1;

        return result;
    };

    // モデル描画
    Study3DApp.prototype.drawModel = function () {
        var g = this.context;

        g.beginPath();
        g.fillStyle = 'white';
        g.fillRect(0, 0, this.width, this.height);

        // 三角形描画のための座標値を格納する配列
        var px = [];
        var py = [];

        for (var i = 0; i < this.faces.length; i++) {
            var face = this.faces[i];

            // 面の輪郭線の描画
            g.beginPath();
            g.strokeStyle = 'black';
            g.lineWidth = 1;
            g.moveTo(face.v[0].screenX, face.v[0].screenY);
            g.lineTo(face.v[1].screenX, face.v[1].screenY);
            g.lineTo(face.v[2].screenX, face.v[2].screenY);
            g.closePath();
            g.stroke();

            // 描画色の指定
            var hsb = this.HSVtoRGB(0.4 * 360, 0.5 * 255, face.nz * 255);
            g.fillStyle = 'rgb(' + hsb.r + ',' + hsb.g + ',' + hsb.b + ')';

            // 面の塗りつぶし
            g.fill();

            g.fillStyle = "black";
            g.fillText('theta = ' + this.theta, 10, 10);
            g.fillText('phi = ' + this.phi, 10, 20);
        }
    };

    // HSBからRGB変換
    Study3DApp.prototype.HSVtoRGB = function (h, s, v) {
        var r, g, b;

        while (h < 0) {
            h += 360;
        }

        h = h % 360;

        // 特別な場合 saturation = 0
        if (s == 0) {
            // → RGB は V に等しい
            v = Math.round(v);
            return { 'r': v, 'g': v, 'b': v };
        }

        s = s / 255;

        var i = Math.floor(h / 60) % 6, f = (h / 60) - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);

        switch (i) {
            case 0:
                r = v;
                g = t;
                b = p;
                break;
            case 1:
                r = q;
                g = v;
                b = p;
                break;
            case 2:
                r = p;
                g = v;
                b = t;
                break;
            case 3:
                r = p;
                g = q;
                b = v;
                break;
            case 4:
                r = t;
                g = p;
                b = v;
                break;
            case 5:
                r = v;
                g = p;
                b = q;
                break;
        }

        return { 'r': Math.round(r), 'g': Math.round(g), 'b': Math.round(b) };
    };
    return Study3DApp;
})();

window.onload = function () {
    var app = new Study3DApp(document.getElementById('content'));
};
//# sourceMappingURL=app.js.map
