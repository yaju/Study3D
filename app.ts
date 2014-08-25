// Class Point
class Point {
    constructor(public x: number, public y: number) { }
}

// 頂点クラス
class Vertex {

    rx: number = 0;
    ry: number = 0;
    rz: number = 0;
    screenX: number = 0;
    screenY: number = 0;

    constructor(public x: number, public y: number, public z: number) { }
}

// 面クラス
class Face {
    v = [];         // 面を構成する3つの頂点
    z: number = 0;	// 奥行き
    nx: number = 0; // 法線
    ny: number = 0;
    nz: number = 0;

    constructor(v0: Vertex, v1: Vertex, v2: Vertex) {
        this.v.push(v0);
        this.v.push(v1);
        this.v.push(v2);
    }
}

class Study3DApp {
	// 頂点データ
	private VERTEX_DATA = [[-1, 0, 0], [0, 1, 0], [0, 0, -1],
                           [1, 0, 0], [0, 0, 1], [0, -1, 0]];
    // 面データ
    private FACE_DATA = [[1, 4, 2], [1, 0, 4], [1, 2, 0], [3, 2, 4],
                         [0, 5, 4], [4, 5, 3], [3, 5, 2], [2, 5, 0]];

    private vertices = [];   		// 頂点列を保持する
    private faces = [];      		// 面（三角形）列を保持する
    private mousePosition:Point;	// マウス位置の初期化
    private phi = 0.20;       		// x軸周りの回転角
    private theta = -0.38;    		// y軸周りの回転角
    private isDrag:boolean = false;

    private width: number;
    private height: number;
    private center: Point;
    private scale: number;
    private context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d");
        this.width = canvas.width = 448;    //window.innerWidth;
        this.height = canvas.height = 448;  //window.innerHeight;
        this.mousePosition = new Point(this.width / 2, this.height / 2);
        this.center = new Point(this.width / 2, this.height / 2);

        // 描画スケールの設定
        this.scale = this.width * 0.8 / 2;

        canvas.addEventListener("mousemove", (e: MouseEvent) => {
            if (!this.isDrag) return;

            // 回転角の更新
            this.theta += (e.clientX - this.mousePosition.x) * 0.01;
            this.phi += (e.clientY - this.mousePosition.y) * 0.01;

            // x軸周りの回転角に上限を設定
            this.phi = Math.min(this.phi, Math.PI / 2);
            this.phi = Math.max(this.phi, -Math.PI / 2);

            // マウス位置の更新
            this.mousePosition = new Point(e.clientX, e.clientY);

            // 頂点のスクリーン座標の更新
            this.setScreenPosition();

            // 描画
            this.drawModel();
        });

        canvas.addEventListener("mousedown", (e: MouseEvent) => {
            // マウスボタン押下イベント
            this.isDrag = true;

            // マウス位置の更新
            this.mousePosition = new Point(e.clientX, e.clientY);
        });
        canvas.addEventListener("mouseup", (e: MouseEvent) => {
            // マウスボタン離されたイベント
            this.isDrag = false;
        });

        // モデルデータの設定
        this.setModelData();

        // 頂点のスクリーン座標の更新
        this.setScreenPosition();

        // 描画
        this.drawModel();
    }

	// モデルデータの設定
	setModelData() {
        // 頂点の作成
        for (var i: number = 0; i < this.VERTEX_DATA.length; i++) {
            this.vertices.push(new Vertex(this.VERTEX_DATA[i][0], this.VERTEX_DATA[i][1], this.VERTEX_DATA[i][2]));
        }

        // 面の作成
        for (var i: number = 0; i < this.FACE_DATA.length; i++) {
            this.faces.push(new Face(this.vertices[this.FACE_DATA[i][0]],
                this.vertices[this.FACE_DATA[i][1]],
                this.vertices[this.FACE_DATA[i][2]]));
        }
    }

    // 頂点のスクリーン座標を更新する
	setScreenPosition() {
        for (var i: number = 0; i < this.vertices.length; i++) {
            var v = this.vertices[i];

            // 回転後の座標値の算出
            v.rx = v.x * Math.cos(this.theta) + v.z * Math.sin(this.theta);
            v.ry = v.x * Math.sin(this.phi) * Math.sin(this.theta) + v.y * Math.cos(this.phi) - v.z * Math.sin(this.phi) * Math.cos(this.theta);
            v.rz = - v.x * Math.cos(this.phi) * Math.sin(this.theta) + v.y * Math.sin(this.phi) + v.z * Math.cos(this.phi) * Math.cos(this.theta);

            // スクリーン座標の算出
            v.screenX = this.center.x + this.scale * v.rx;
            v.screenY = this.center.y - this.scale * v.ry;
        }

        for (var i:number = 0; i < this.faces.length; i++) {
            var face = this.faces[i];

            // 面の奥行き座標を更新
            face.z = 0.0;
            for (var j: number = 0; j < 3; j++) {
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
            var l: number = Math.sqrt(face.nx * face.nx
                            + face.ny * face.ny + face.nz * face.nz);
            face.nx /= l;
            face.ny /= l;
            face.nz /= l;
        }

        // 面を奥行き座標で並び替える
        this.faces.sort(function (a, b) {
            return a["z"] - b["z"];
        });
    }

    // モデル描画
	drawModel() {
        var g: CanvasRenderingContext2D = this.context;

        g.beginPath();
        g.fillStyle = 'white';
        g.fillRect(0, 0, this.width, this.height);

        // 三角形描画のための座標値を格納する配列
        var px = [];
        var py = [];

        // 各面の描画
        for (var i:number = 0; i < this.faces.length; i++) {
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
        }
    }

    // HSBからRGB変換
	HSVtoRGB(h: number, s: number, v: number) {
        var r: number, g: number, b: number; // 0..255

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

        var i: number = Math.floor(h / 60) % 6,
                        f = (h / 60) - i,
                        p = v * (1 - s),
                        q = v * (1 - f * s),
                        t = v * (1 - (1 - f) * s);

		switch (i) {
            case 0:
                r = v; g = t; b = p; break;
            case 1:
                r = q; g = v; b = p; break;
            case 2:
                r = p; g = v; b = t; break;
            case 3:
                r = p; g = q; b = v; break;
            case 4:
                r = t; g = p; b = v; break;
            case 5:
                r = v; g = p; b = q; break;
        }

        return { 'r': Math.round(r), 'g': Math.round(g), 'b': Math.round(b) };
    }
}

window.onload = () => {
    var app = new Study3DApp(<HTMLCanvasElement>document.getElementById('content'));
};