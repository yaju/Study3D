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

// 平面クラス
class Plane {

    p = [];
    vertices = [];

    constructor(public center: Point, public scale: number, public style:string) { }

    // 頂点のスクリーン座標を更新する
    setScreenPosition(theta, phi) {
        this.p = [];
        for (var i: number = 0; i < this.vertices.length; i++) {
            var v: Vertex = <Vertex>this.vertices[i];

            // 回転後の座標値の算出
            v.rx = v.x * Math.cos(theta) + v.z * Math.sin(theta);
            v.ry = v.x * Math.sin(phi) * Math.sin(theta) + v.y * Math.cos(phi) - v.z * Math.sin(phi) * Math.cos(theta);
            v.rz = - v.x * Math.cos(phi) * Math.sin(theta) + v.y * Math.sin(phi) + v.z * Math.cos(phi) * Math.cos(theta);

            // スクリーン座標の算出
            v.screenX = this.center.x + this.scale * v.rx;
            v.screenY = this.center.y - this.scale * v.ry;

            // 回転後の各頂点の座標を計算
            this.p.push(new Point(v.screenX, v.screenY));
        }
    }

    // 描画処理
    draw(g: CanvasRenderingContext2D, p1: Point, p2: Point) {
        g.beginPath();
        g.lineWidth = 0.5;
        g.moveTo(p1.x, p1.y);
        g.lineTo(p2.x, p2.y);
        g.closePath();
        g.strokeStyle = this.style;
        g.stroke();
    }
}

// 軸クラス
class Axis extends Plane  {

    constructor(center: Point, scale: number, style: string, ax: string) {
        super(center, scale, style);

        var vertice = [];
        // 頂点
        switch (ax) {
            case 'x':
                vertice = [[-1, 0, 0], [1, 0, 0], [1, 0, 0], [-1, 0, 0]];
                break;
            case 'y':
                vertice = [[0, -1, 0], [0, 1, 0], [0, 1, 0], [0, -1, 0]];
                break;
            case 'z':
                vertice = [[0, 0, -1], [0, 0, 1], [0, 0, 1], [0, 0, -1]];
                break;
        }

        for (var i: number = 0; i < vertice.length; i++) {
            var v: Vertex = new Vertex(vertice[i][0], vertice[i][1], vertice[i][2]);
            this.vertices.push(v);
        }
    }

    // 軸描画処理
    draw(g:  CanvasRenderingContext2D) {
        super.draw(g, this.p[0], this.p[1]);
    }
}

// 立方体軸クラス
class AxisCube extends Plane  {

    constructor(center: Point, scale: number, style: string) {
        super(center, scale, style);

        var diff = (f:boolean) => { return f ? 1 : -1; }

        // 立方体の頂点８つを作成する
        //i   x   y   z
        //0   1   1   1
        //1  -1   1   1
        //2  -1  -1   1
        //3   1  -1   1
        //4   1   1  -1
        //5  -1   1  -1 
        //6  -1  -1  -1
        //7   1  -1  -1
        for(var i:number = 0; i < 8; i++) {
            var v: Vertex = new Vertex(diff(i % 4 % 3 == 0), diff(i % 4 < 2), diff(i < 4));
            this.vertices.push(v);
        }
    }

    draw(g: CanvasRenderingContext2D) {
        // 頂点の間を線で結ぶ
        for(var i:number = 0; i < 4; i++) {
            super.draw(g, this.p[i], this.p[i + 4]);
            super.draw(g, this.p[i], this.p[(i + 1) % 4]);
            super.draw(g, this.p[i + 4], this.p[(i + 1) % 4 + 4]);
        }
    }
}

// モデルオブジェクトクラス
class ModelObject extends Plane {
    private faces = [];      		// 面（三角形）列を保持する
    private isModels: NodeList;

    isWireFrame: Boolean = true;
    isFill: Boolean = true;
    isCulling: Boolean = true;

    constructor(center: Point, scale: number, style: string, elms: NodeList) {
        super(center, scale, style);
        this.isModels = elms;
    }

    // モデルデータの設定
    setModelData() {
        this.vertices = []; 		// 頂点列を初期化
        this.faces = [];			// 面列を初期化
        var minV = new Vertex(10000, 10000, 10000);
        var maxV = new Vertex(-10000, -10000, -10000);
        var models = [];
        var addfaces: number = 0;

        // 立方体,球,円柱,三角錐,トーラス
        var modelClass = [Cube, Sphere, Cylinder, Cone, Torus];

        // 各モデルの表示有無を設定
        for (var i = 0; i < this.isModels.length; i++) {
            var chkElm: HTMLInputElement = <HTMLInputElement>this.isModels[i];
            if (chkElm.checked) models.push(modelClass[i]);
        }

        // 各モデルデータを生成する
        for (var m = 0; m < models.length; m++) {
            var modelData: ModelData = models[m];
            // トークンごとの読み込み
            for (var i = 0; i < modelData.vertices.length; i += 3) {
                var x = modelData.vertices[i + 0];
                var y = modelData.vertices[i + 1];
                var z = modelData.vertices[i + 2];

                // モデルサイズを更新
                minV.x = Math.min(minV.x, x);
                minV.y = Math.min(minV.y, y);
                minV.z = Math.min(minV.z, z);

                maxV.x = Math.max(maxV.x, x);
                maxV.y = Math.max(maxV.y, y);
                maxV.z = Math.max(maxV.z, z);

                // 頂点列に新しい頂点を追加
                this.vertices.push(new Vertex(x, y, z));
            }
            for (var i = 0; i < modelData.faces.length; i += 3) {
                // 頂点インデックスの取得
                var v0 = modelData.faces[i + 0];
                var v1 = modelData.faces[i + 1];
                var v2 = modelData.faces[i + 2];

                // 面列に新しい面を追加
                this.faces.push(new Face(this.vertices[v0 - 1 + addfaces],
                    this.vertices[v1 - 1 + addfaces],
                    this.vertices[v2 - 1 + addfaces]));
            }
            addfaces += (modelData.vertices.length / 3);
        }

        var modelSize = Math.max(maxV.x - minV.x, maxV.y - minV.y);
        modelSize = Math.max(modelSize, maxV.z - minV.z);

        // モデルの大きさが原点を中心とする1辺が2の立方体に収まるようにする
        for (var i = 0; i < this.vertices.length; i++) {
            var v = this.vertices[i];
            v.x = (v.x - (minV.x + maxV.x) / 2) / modelSize * 2;
            v.y = (v.y - (minV.y + maxV.y) / 2) / modelSize * 2;
            v.z = (v.z - (minV.z + maxV.z) / 2) / modelSize * 2;
        }
    }

    // 頂点のスクリーン座標を更新する
    setScreenPosition(theta: number, phi: number) {
        super.setScreenPosition(theta, phi);

        for (var i: number = 0; i < this.faces.length; i++) {
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
            var l: number = Math.sqrt(face.nx * face.nx + face.ny * face.ny + face.nz * face.nz);
            face.nx /= l;
            face.ny /= l;
            face.nz /= l;
        }

        // 面を奥行き座標で並び替える
        this.faces.sort(function (a, b) {
            return a["z"] - b["z"];
        });
    }

    //３点が時計回りかどうかを調べる
    //時計回りなら１，反時計回りで-1、直線で０を返す。
    isFace(p1: Point, p2: Point, p3: Point) {
        var result: number = 0;
        var dx2: number;
        var dy2: number;
        var dx3: number;
        var dy3: number;

        dx2 = p2.x - p1.x;
        dy2 = p2.y - p1.y;
        dx3 = p3.x - p1.x;
        dy3 = p3.y - p1.y;

        if ((dx2 * dy3) > (dx3 * dy2)) result = -1;
        else if ((dx2 * dy3) < (dx3 * dy2)) result = 1;

        return result;
    }

    // モデル描画
    draw(g: CanvasRenderingContext2D) {
        // 三角形描画のための座標値を格納する配列
        var px = [];
        var py = [];

        // 各面の描画
        for (var i: number = 0; i < this.faces.length; i++) {
            var face = this.faces[i];
            var pt1: Point = new Point(face.v[0].screenX, face.v[0].screenY);
            var pt2: Point = new Point(face.v[1].screenX, face.v[1].screenY);
            var pt3: Point = new Point(face.v[2].screenX, face.v[2].screenY);

            // カリング(隠面は描画しない)
            if (this.isCulling) {
                // 裏表を三角形頂点の配置順序で判定(時計回り以外なら描画しない)
                if (this.isFace(pt1, pt2, pt3) <= 0) continue;
                // 裏表を法線ベクトルで判定
                //if (face.nz < 0) continue;
            }

            // 面の輪郭線の描画(三角形)
            g.beginPath();
            g.strokeStyle = 'black';
            g.lineWidth = 1;
            g.moveTo(pt1.x, pt1.y);
            g.lineTo(pt2.x, pt2.y);
            g.lineTo(pt3.x, pt3.y);
            g.closePath();
            if (this.isWireFrame) {
                g.stroke();
            }

            // 面の塗りつぶし
            if (this.isFill) {
                // 描画色の指定
                var hsb = this.HSVtoRGB(0.4 * 360, 0.5 * 255, face.nz * 255);
                g.fillStyle = 'rgb(' + hsb.r + ',' + hsb.g + ',' + hsb.b + ')';
                // 面の塗りつぶし
                g.fill();
            }
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

// メインクラス
class Study3DApp {
    private mousePosition: Point;	// マウス位置の初期化
    private phi = 0.30;        		// x軸周りの回転角
    private theta = 0.50;  		    // y軸周りの回転角
    private isDrag: boolean = false;
    private elmWireFrame: HTMLInputElement;
    private elmFill: HTMLInputElement;
    private elmCulling: HTMLInputElement;
    private elmAxis: HTMLInputElement;
    private elmAxisCube: HTMLInputElement;
    private elmModels: NodeList;
    
    private width: number;
    private height: number;
    private center: Point;
    private scale: number;
    private context: CanvasRenderingContext2D;
    private modelObj: ModelObject;
    private axisCube: AxisCube;
    private axis = [];

    constructor(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d");
        this.width = canvas.width = 448;    //window.innerWidth;
        this.height = canvas.height = 448;  //window.innerHeight;
        this.mousePosition = new Point(this.width / 2, this.height / 2);

        this.elmWireFrame = <HTMLInputElement>document.getElementById('wireFrameCheck');
        this.elmFill = <HTMLInputElement>document.getElementById('fillCheck');
        this.elmCulling = <HTMLInputElement>document.getElementById('cullingCheck');
        this.elmAxis = <HTMLInputElement>document.getElementById('axisCheck');
        this.elmAxisCube = <HTMLInputElement>document.getElementById('axisCubeCheck');
        this.elmModels = <NodeList>document.getElementsByName('models');


        // 中央位置の設定
        this.center = new Point(this.width / 2, this.height / 2);
        // 描画スケールの設定
        this.scale = this.width * 0.6 / 2;
        this.modelObj = new ModelObject(this.center, this.scale, 'black', this.elmModels);

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
            // 描画
            this.render();
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

        // 各チェックボックス変更
        this.elmWireFrame.addEventListener("change", () => {
            this.modelObj.isWireFrame = this.elmWireFrame.checked;
            this.render();
        });
        this.elmFill.addEventListener("change", () => {
            this.modelObj.isFill = this.elmFill.checked;
            this.render();
        });
        this.elmCulling.addEventListener("change", () => {
            this.modelObj.isCulling = this.elmCulling.checked;
            this.render();
        });
        this.elmAxis.addEventListener("change", () => {
            this.render();
        });
        this.elmAxisCube.addEventListener("change", () => {
            this.render();
        });

        for (var i = 0; i < this.elmModels.length; i++) {
            this.elmModels[i].addEventListener("change", () => {
                // モデルデータの設定
                this.modelObj.setModelData();
                this.render();
            });
        }

        // モデルデータの設定
        this.modelObj.setModelData();

        this.axisCube = new AxisCube(this.center, this.scale, 'darkgray');

        // 軸 立方体より少しはみ出すために1.2倍長くする
        this.axis.push(new Axis(this.center, this.scale * 1.2, 'blue', 'x'));
        this.axis.push(new Axis(this.center, this.scale * 1.2, 'green', 'y'));
        this.axis.push(new Axis(this.center, this.scale * 1.2, 'red', 'z'));

        // 描画
        this.render();
    }

    // 情報表示
    drawInfo() {
        var elm = document.getElementById("info");
        elm.innerText = 'theta: ' + this.theta.toFixed(2) + ' / phi: ' + this.phi.toFixed(2);
    }

    // 描画クリア
    drawClear(g: CanvasRenderingContext2D) {
        g.beginPath();
        g.fillStyle = 'aliceblue';
        g.fillRect(0, 0, this.width, this.height);
    }

    // 描画
    render() {
        var g: CanvasRenderingContext2D = this.context;

        // 描画クリア
        this.drawClear(g);

        // モデル描画
        this.modelObj.setScreenPosition(this.theta, this.phi);
        this.modelObj.draw(g);

        // 軸立方体描画
        if (this.elmAxisCube.checked) {
            this.axisCube.setScreenPosition(this.theta, this.phi);
            this.axisCube.draw(g);
        }

        if (this.elmAxis.checked) {
            // 軸描画
            for (var i = 0; i < this.axis.length; i++) {
                this.axis[i].setScreenPosition(this.theta, this.phi);
                this.axis[i].draw(g);
            }
        }

        // 情報表示
        this.drawInfo();
    }
}

window.onload = () => {
    var app = new Study3DApp(<HTMLCanvasElement>document.getElementById('content'));
};

// インターフェイスの定義
interface ModelData{
    vertices: number[];
    faces: number[];
}

// 各モデルデータ
// 立方体
var Cube: ModelData = {

    "vertices": [
        90.430107, 55.500000, -199.239578,
        -20.569866,55.500000,-199.239578,
        90.430107, 55.500000,-88.239563,
        -20.569866, 55.500000,-88.239563,
        90.430107, -55.500000,-88.239563,
        -20.569866, -55.500000,-88.239563,
        90.430107, -55.500000,-199.239578,
        -20.569866, -55.500000,-199.239578
    ],
    "faces": [
        2, 4, 3,
        2, 3, 1,
        4, 6, 5,
        4, 5, 3,
        6, 8, 7,
        6, 7, 5,
        8, 2, 1,
        8, 1, 7,
        8, 6, 4,
        8, 4, 2,
        1, 3, 5,
        1, 5, 7
    ]
}

// 球
var Sphere: ModelData = {

    "vertices": [
		-130.605957,142.313446,-143.870667,
		-130.605957,134.701370,-105.602379,
		-157.665802,134.701370,-116.810890,
		-168.874298,134.701370,-143.870667,
		-157.665802,134.701370,-170.930450,
		-130.605957,134.701370,-182.138947,
		-103.546165,134.701370,-170.930450,
		-92.337563,134.701370,-143.870667,
		-103.546165,134.701370,-116.810890,
		-130.605957,113.024162,-73.159966,
		-180.605988,113.024162,-93.870689,
		-201.316589,113.024162,-143.870667,
		-180.605988,113.024162,-193.870605,
		-130.605957,113.024162,-214.581299,
		-80.605972,113.024162,-193.870605,
		-59.895271,113.024162,-143.870667,
		-80.605972,113.024162,-93.870689,
		-130.605957,80.581764,-51.482758,
		-195.934113,80.581764,-78.542587,
		-222.993958,80.581764,-143.870667,
		-195.934113,80.581764,-209.198700,
		-130.605957,80.581764,-236.258484,
		-65.277763,80.581764,-209.198700,
		-38.217968,80.581764,-143.870667,
		-65.277763,80.581764,-78.542587,
		-130.605957,42.313454,-43.870667,
		-201.316589,42.313454,-73.159966,
		-230.606018,42.313454,-143.870667,
		-201.316589,42.313454,-214.581299,
		-130.605957,42.313454,-243.870575,
		-59.895271,42.313454,-214.581299,
		-30.605968,42.313454,-143.870667,
		-59.895271,42.313454,-73.159966,
		-130.605957,4.045067,-51.482758,
		-195.934113,4.045067,-78.542587,
		-222.993958,4.045067,-143.870667,
		-195.934113,4.045067,-209.198700,
		-130.605957,4.045067,-236.258484,
		-65.277763,4.045067,-209.198700,
		-38.217968,4.045067,-143.870667,
		-65.277763,4.045067,-78.542587,
		-130.605957,-28.397240,-73.159966,
		-180.605988,-28.397240,-93.870689,
		-201.316589,-28.397240,-143.870667,
		-180.605988,-28.397240,-193.870605,
		-130.605957,-28.397240,-214.581299,
		-80.605972,-28.397240,-193.870605,
		-59.895271,-28.397240,-143.870667,
		-80.605972,-28.397240,-93.870689,
		-130.605957,-50.074440,-105.602379,
		-157.665802,-50.074440,-116.810890,
		-168.874298,-50.074440,-143.870667,
		-157.665802,-50.074440,-170.930450,
		-130.605957,-50.074440,-182.138947,
		-103.546165,-50.074440,-170.930450,
		-92.337563,-50.074440,-143.870667,
		-103.546165,-50.074440,-116.810890,
		-130.605957,-57.686539,-143.870667
	],
  "faces": [
		1,3,2,
	    1,4,3,
	    1,5,4,
	    1,6,5,
	    1,7,6,
	    1,8,7,
	    1,9,8,
	    1,2,9,
	    3,11,10,
	    3,10,2,
	    4,12,11,
	    4,11,3,
	    5,13,12,
	    5,12,4,
	    6,14,13,
	    6,13,5,
	    7,15,14,
	    7,14,6,
	    8,16,15,
	    8,15,7,
	    9,17,16,
	    9,16,8,
	    2,10,17,
	    2,17,9,
	    11,19,18,
	    11,18,10,
	    12,20,19,
	    12,19,11,
	    13,21,20,
	    13,20,12,
	    14,22,21,
	    14,21,13,
	    15,23,22,
	    15,22,14,
	    16,24,23,
	    16,23,15,
	    17,25,24,
	    17,24,16,
	    10,18,25,
	    10,25,17,
	    19,27,26,
	    19,26,18,
	    20,28,27,
	    20,27,19,
	    21,29,28,
	    21,28,20,
	    22,30,29,
	    22,29,21,
	    23,31,30,
	    23,30,22,
	    24,32,31,
	    24,31,23,
	    25,33,32,
	    25,32,24,
	    18,26,33,
	    18,33,25,
	    27,35,34,
	    27,34,26,
	    27,28,36,
	    27,36,35,
	    29,37,36,
	    29,36,28,
	    30,38,37,
	    30,37,29,
	    31,39,38,
	    31,38,30,
	    32,40,39,
	    32,39,31,
	    33,41,40,
	    33,40,32,
	    26,34,41,
	    26,41,33,
	    35,43,42,
	    35,42,34,
	    36,44,43,
	    36,43,35,
	    37,45,44,
	    37,44,36,
	    38,46,45,
	    38,45,37,
	    39,47,46,
	    39,46,38,
	    40,48,47,
	    40,47,39,
	    41,49,48,
	    41,48,40,
	    34,42,49,
	    34,49,41,
	    43,51,50,
	    43,50,42,
	    44,52,51,
	    44,51,43,
	    45,53,52,
	    45,52,44,
	    46,54,53,
	    46,53,45,
	    47,55,54,
	    47,54,46,
	    48,56,55,
	    48,55,47,
	    49,57,56,
	    49,56,48,
	    42,50,57,
	    42,57,49,
	    50,51,58,
	    51,52,58,
	    52,53,58,
	    53,54,58,
	    54,55,58,
	    55,56,58,
	    56,57,58,
	    57,50,58
    ]
}

// 円柱
var Cylinder: ModelData = {

    "vertices": [
        - 152.572266,60.383301, 17.264740,
        - 152.572266,60.383301, 77.564041,
        - 195.210297,60.383301, 59.902740,
        - 212.871582,60.383301, 17.264740,
        - 195.210297,60.383301, -25.373260,
        - 152.572266,60.383301, -43.034561,
        - 109.934174,60.383301, -25.373260,
        - 92.272972,60.383301, 17.264740,
        - 109.934174,60.383301, 59.902740,
        - 152.572266, -60.383301, 77.564041,
        - 195.210297, -60.383301, 59.902740,
        - 212.871582, -60.383301, 17.264740,
        - 195.210297, -60.383301, -25.373260,
        - 152.572266, -60.383301, -43.034561,
        - 109.934174, -60.383301, -25.373260,
        - 92.272972, -60.383301, 17.264740,
        - 109.934174, -60.383301, 59.902740,
        - 152.572266, -60.383301,17.264740
    ],
    "faces": [
        1,3,2,
        1,4,3,
        1,5,4,
        1,6,5,
        1,7,6,
        1,8,7,
        1,9,8,
        1,2,9,
        18,10,11,
        18,11,12,
        18,12,13,
        18,13,14,
        18,14,15,
        18,15,16,
        18,16,17,
        18,17,10,
        3,11,10,
        3,10,2,
        4,12,11,
        4,11,3,
        5,13,12,
        5,12,4,
        6,14,13,
        6,13,5,
        7,15,14,
        7,14,6,
        8,16,15,
        8,15,7,
        9,17,16,
        9,16,8,
        2,10,17,
        2,17,9
    ]
}

// 円錐
var Cone: ModelData = {

    "vertices": [
        126.650078, -57.389599, 113.952911,
        55.939430, -57.389599, 84.663589,
        26.650139, -57.389599, 13.952896,
        55.939430, -57.389599, -56.757706,
        126.650078, -57.389599, -86.047104,
        197.360748, -57.389599, -56.757706,
        226.650055, -57.389599, 13.952896,
        197.360748, -57.389599, 84.663589,
        126.650078, 142.610397, 13.952896,
        126.650078, -57.389599, 13.952896
    ],
    "faces": [
        1, 9, 2,
        2, 9, 3,
        3, 9, 4,
        4, 9, 5,
        5, 9, 6,
        6, 9, 7,
        7, 9, 8,
        8, 9, 1,
        10, 1, 2,
        10, 2, 3,
        10, 3, 4,
        10, 4, 5,
        10, 5, 6,
        10, 6, 7,
        10, 7, 8,
        10, 8, 1
    ]
}

// トーラス
var Torus: ModelData = {

    "vertices": [
        -68.520660, -32.294884, 143.208054,
        -77.600372, -10.374584, 143.208054,
        -99.520676, -1.294884, 143.208054,
        -121.440956, -10.374584, 143.208054,
        -130.520660, -32.294884, 143.208054,
        -121.440956, -54.215183, 143.208054,
        -99.520676, -63.294884, 143.208054,
        -77.600372, -54.215183, 143.208054,
        -65.628059, -32.294884, 157.750046,
        -74.016663, -10.374584, 161.224716,
        -94.268364, -1.294884, 169.613297,
        -114.520058, -10.374584, 178.001785,
        -122.908669, -32.294884, 181.476456,
        -114.520058, -54.215183, 178.001785,
        -94.268364, -63.294884, 169.613297,
        -74.016663, -54.215183, 161.224716,
        -57.390766, -32.294884, 170.078140,
        -63.811066, -10.374584, 176.498489,
        -79.311066, -1.294884, 191.998520,
        -94.811058, -10.374584, 207.498489,
        -101.231369, -32.294884, 213.918747,
        -94.811058, -54.215183, 207.498489,
        -79.311066, -63.294884, 191.998520,
        -63.811066, -54.215183, 176.498489,
        -45.062664, -32.294884, 178.315567,
        -48.537266, -10.374584, 186.704056,
        -56.925869, -1.294884, 206.955765,
        -65.314369, -10.374584, 227.207565,
        -68.788971, -32.294884, 235.596054,
        -65.314369, -54.215183, 227.207565,
        -56.925869, -63.294884, 206.955765,
        -48.537266, -54.215183, 186.704056,
        -30.520664, -32.294884, 181.208084,
        -30.520664, -10.374584, 190.287827,
        -30.520664, -1.294884, 212.208054,
        -30.520664, -10.374584, 234.128464,
        -30.520664, -32.294884, 243.208084,
        -30.520664, -54.215183, 234.128464,
        -30.520664, -63.294884, 212.208054,
        -30.520664, -54.215183, 190.287827,
        -15.978664, -32.294884, 178.315567,
        -12.504070, -10.374584, 186.704056,
        -4.115463, -1.294884, 206.955765,
        4.273026, -10.374584, 227.207565,
        7.747639, -32.294884, 235.596054,
        4.273026, -54.215183, 227.207565,
        -4.115463, -63.294884, 206.955765,
        -12.504070, -54.215183, 186.704056,
        -3.650574, -32.294884, 170.078140,
        2.769730, -10.374584, 176.498489,
        18.269737, -1.294884, 191.998520,
        33.769737, -10.374584, 207.498489,
        40.190041, -32.294884, 213.918747,
        33.769737, -54.215183, 207.498489,
        18.269737, -63.294884, 191.998520,
        2.769730, -54.215183, 176.498489,
        4.586731, -32.294884, 157.750046,
        12.975330, -10.374584, 161.224716,
        33.227043, -1.294884, 169.613297,
        53.478737, -10.374584, 178.001785,
        61.867226, -32.294884, 181.476456,
        53.478737, -54.215183, 178.001785,
        33.227043, -63.294884, 169.613297,
        12.975330, -54.215183, 161.224716,
        7.479343, -32.294884, 143.208115,
        16.559044, -10.374584, 143.208115,
        38.479347, -1.294884, 143.208115,
        60.399605, -10.374584, 143.208115,
        69.479317, -32.294884, 143.208115,
        60.399605, -54.215183, 143.208115,
        38.479347, -63.294884, 143.208115,
        16.559044, -54.215183, 143.208115,
        4.586731, -32.294884, 128.666122,
        12.975330, -10.374584, 125.191429,
        33.227043, -1.294884, 116.802948,
        53.478737, -10.374584, 108.414444,
        61.867317, -32.294884, 104.939743,
        53.478737, -54.215183, 108.414444,
        33.227043, -63.294884, 116.802948,
        12.975330, -54.215183, 125.191429,
        -3.650574, -32.294884, 116.338043,
        2.769730, -10.374584, 109.917740,
        18.269737, -1.294884, 94.417740,
        33.769737, -10.374584, 78.917740,
        40.190041, -32.294884, 72.497437,
        33.769737, -54.215183, 78.917740,
        18.269737, -63.294884, 94.417740,
        2.769730, -54.215183, 109.917740,
        -15.978664, -32.294884, 108.100632,
        -12.504070, -10.374584, 99.712143,
        -4.115463, -1.294884, 79.460434,
        4.273026, -10.374584, 59.208633,
        7.747730, -32.294884, 50.820129,
        4.273026, -54.215183, 59.208633,
        -4.115463, -63.294884, 79.460434,
        -12.504070, -54.215183, 99.712143,
        -30.520664, -32.294884, 105.208038,
        -30.520664, -10.374584, 96.128433,
        -30.520664, -1.294884, 74.208038,
        -30.520664, -10.374584, 52.287735,
        -30.520664, -32.294884, 43.208038,
        -30.520664, -54.215183, 52.287735,
        -30.520664, -63.294884, 74.208038,
        -30.520664, -54.215183, 96.128433,
        -45.062664, -32.294884, 108.100632,
        -48.537266, -10.374584, 99.712143,
        -56.925869, -1.294884, 79.460434,
        -65.314369, -10.374584, 59.208633,
        -68.789062, -32.294884, 50.820129,
        -65.314369, -54.215183, 59.208633,
        -56.925869, -63.294884, 79.460434,
        -48.537266, -54.215183, 99.712143,
        -57.390766, -32.294884, 116.338043,
        -63.811066, -10.374584, 109.917740,
        -79.311066, -1.294884, 94.417740,
        -94.811058, -10.374584, 78.917740,
        -101.231369, -32.294884, 72.497437,
        -94.811058, -54.215183, 78.917740,
        -79.311066, -63.294884, 94.417740,
        -63.811066, -54.215183, 109.917740,
        -65.628059, -32.294884, 128.666122,
        -74.016663, -10.374584, 125.191521,
        -94.268364, -1.294884, 116.802948,
        -114.520058, -10.374584, 108.414444,
        -122.908669, -32.294884, 104.939743,
        -114.520058, -54.215183, 108.414444,
        -94.268364, -63.294884, 116.802948,
        -74.016663, -54.215183, 125.191521,
        126.650078, -57.389599, 113.952911,
        55.939430, -57.389599, 84.663589,
        26.650139, -57.389599, 13.952896,
        55.939430, -57.389599, -56.757706,
        126.650078, -57.389599, -86.047104,
        197.360748, -57.389599, -56.757706,
        226.650055, -57.389599, 13.952896,
        197.360748, -57.389599, 84.663589,
        126.650078, 142.610397, 13.952896,
        126.650078, -57.389599, 13.952896
    ],
    "faces": [
        2, 10, 9,
        2, 9, 1,
        3, 11, 10,
        3, 10, 2,
        4, 12, 11,
        4, 11, 3,
        5, 13, 12,
        5, 12, 4,
        6, 14, 13,
        6, 13, 5,
        7, 15, 14,
        7, 14, 6,
        8, 16, 15,
        8, 15, 7,
        1, 9, 16,
        1, 16, 8,
        10, 18, 17,
        10, 17, 9,
        10, 11, 19,
        10, 19, 18,
        12, 20, 19,
        12, 19, 11,
        13, 21, 20,
        13, 20, 12,
        14, 22, 21,
        14, 21, 13,
        15, 23, 22,
        15, 22, 14,
        16, 24, 23,
        16, 23, 15,
        9, 17, 24,
        9, 24, 16,
        18, 26, 25,
        18, 25, 17,
        19, 27, 26,
        19, 26, 18,
        20, 28, 27,
        20, 27, 19,
        21, 29, 28,
        21, 28, 20,
        22, 30, 29,
        22, 29, 21,
        23, 31, 30,
        23, 30, 22,
        24, 32, 31,
        24, 31, 23,
        17, 25, 32,
        17, 32, 24,
        26, 34, 33,
        26, 33, 25,
        27, 35, 34,
        27, 34, 26,
        28, 36, 35,
        28, 35, 27,
        29, 37, 36,
        29, 36, 28,
        30, 38, 37,
        30, 37, 29,
        31, 39, 38,
        31, 38, 30,
        32, 40, 39,
        32, 39, 31,
        25, 33, 40,
        25, 40, 32,
        34, 42, 41,
        34, 41, 33,
        35, 43, 42,
        35, 42, 34,
        36, 44, 43,
        36, 43, 35,
        37, 45, 44,
        37, 44, 36,
        38, 46, 45,
        38, 45, 37,
        39, 47, 46,
        39, 46, 38,
        40, 48, 47,
        40, 47, 39,
        33, 41, 48,
        33, 48, 40,
        42, 50, 49,
        42, 49, 41,
        43, 51, 50,
        43, 50, 42,
        44, 52, 51,
        44, 51, 43,
        45, 53, 52,
        45, 52, 44,
        46, 54, 53,
        46, 53, 45,
        47, 55, 54,
        47, 54, 46,
        48, 56, 55,
        48, 55, 47,
        41, 49, 56,
        41, 56, 48,
        50, 58, 57,
        50, 57, 49,
        51, 59, 58,
        51, 58, 50,
        52, 60, 59,
        52, 59, 51,
        53, 61, 60,
        53, 60, 52,
        54, 62, 61,
        54, 61, 53,
        55, 63, 62,
        55, 62, 54,
        56, 64, 63,
        56, 63, 55,
        49, 57, 64,
        49, 64, 56,
        58, 66, 65,
        58, 65, 57,
        59, 67, 66,
        59, 66, 58,
        59, 60, 68,
        59, 68, 67,
        61, 69, 68,
        61, 68, 60,
        62, 70, 69,
        62, 69, 61,
        63, 71, 70,
        63, 70, 62,
        64, 72, 71,
        64, 71, 63,
        57, 65, 72,
        57, 72, 64,
        66, 74, 73,
        66, 73, 65,
        67, 75, 74,
        67, 74, 66,
        68, 76, 75,
        68, 75, 67,
        69, 77, 76,
        69, 76, 68,
        70, 78, 77,
        70, 77, 69,
        70, 71, 79,
        70, 79, 78,
        72, 80, 79,
        72, 79, 71,
        65, 73, 80,
        65, 80, 72,
        74, 82, 81,
        74, 81, 73,
        74, 75, 83,
        74, 83, 82,
        76, 84, 83,
        76, 83, 75,
        77, 85, 84,
        77, 84, 76,
        78, 86, 85,
		78, 85, 77,
        79, 87, 86,
        79, 86, 78,
        80, 88, 87,
        80, 87, 79,
        73, 81, 88,
        73, 88, 80,
        82, 90, 89,
        82, 89, 81,
        83, 91, 90,
        83, 90, 82,
        84, 92, 91,
        84, 91, 83,
        85, 93, 92,
        85, 92, 84,
        86, 94, 93,
        86, 93, 85,
        87, 95, 94,
        87, 94, 86,
        88, 96, 95,
        88, 95, 87,
        81, 89, 96,
        81, 96, 88,
        90, 98, 97,
        90, 97, 89,
        91, 99, 98,
        91, 98, 90,
        92, 100, 99,
        92, 99, 91,
        93, 101, 100,
        93, 100, 92,
        94, 102, 101,
        94, 101, 93,
        95, 103, 102,
        95, 102, 94,
        96, 104, 103,
        96, 103, 95,
        89, 97, 104,
        89, 104, 96,
        98, 106, 105,
        98, 105, 97,
        99, 107, 106,
        99, 106, 98,
        100, 108, 107,
        100, 107, 99,
        101, 109, 108,
        101, 108, 100,
        102, 110, 109,
        102, 109, 101,
        103, 111, 110,
        103, 110, 102,
        104, 112, 111,
        104, 111, 103,
        97, 105, 112,
        97, 112, 104,
        106, 114, 113,
        106, 113, 105,
        107, 115, 114,
        107, 114, 106,
        108, 116, 115,
        108, 115, 107,
        109, 117, 116,
        109, 116, 108,
        110, 118, 117,
        110, 117, 109,
        111, 119, 118,
        111, 118, 110,
        112, 120, 119,
        112, 119, 111,
        105, 113, 120,
        105, 120, 112,
        114, 122, 121,
        114, 121, 113,
        115, 123, 122,
        115, 122, 114,
        116, 124, 123,
        116, 123, 115,
        117, 125, 124,
        117, 124, 116,
        118, 126, 125,
        118, 125, 117,
        119, 127, 126,
        119, 126, 118,
        120, 128, 127,
        120, 127, 119,
        113, 121, 128,
        113, 128, 120,
        122, 2, 1,
        122, 1, 121,
        123, 3, 2,
        123, 2, 122,
        124, 4, 3,
        124, 3, 123,
        125, 5, 4,
        125, 4, 124,
        126, 6, 5,
        126, 5, 125,
        127, 7, 6,
        127, 6, 126,
        128, 8, 7,
        128, 7, 127,
        121, 1, 8,
        121, 8, 128
    ]
}