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
    color: string = "#000000";

    constructor(v0: Vertex, v1: Vertex, v2: Vertex, c: string) {
        this.v.push(v0);
        this.v.push(v1);
        this.v.push(v2);
        this.color = c;
    }
}

// 平面クラス
class Plane {

    p = [];
    vertices = [];

    constructor(public center: Point, public scale: number, public style: string) { }

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
class Axis extends Plane {

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
    draw(g: CanvasRenderingContext2D) {
        super.draw(g, this.p[0], this.p[1]);
    }
}

// 立方体軸クラス
class AxisCube extends Plane {

    constructor(center: Point, scale: number, style: string) {
        super(center, scale, style);

        var diff = (f: boolean) => { return f ? 1 : -1; }

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
        for (var i: number = 0; i < 8; i++) {
            var v: Vertex = new Vertex(diff(i % 4 % 3 == 0), diff(i % 4 < 2), diff(i < 4));
            this.vertices.push(v);
        }
    }

    draw(g: CanvasRenderingContext2D) {
        // 頂点の間を線で結ぶ
        for (var i: number = 0; i < 4; i++) {
            super.draw(g, this.p[i], this.p[i + 4]);
            super.draw(g, this.p[i], this.p[(i + 1) % 4]);
            super.draw(g, this.p[i + 4], this.p[(i + 1) % 4 + 4]);
        }
    }
}

// インターフェイスの定義
class ModelData {
    vertices: number[][];
    faces: number[];
    colors: string[];
}

// モデルオブジェクトクラス
class ModelObject extends Plane {
    private faces = [];      		// 面（三角形）列を保持する
    private isModels: NodeList;
    private modelData: ModelData;
    private hasColor: Boolean;

    animeLength: number;

    isWireFrame: Boolean = true;
    isFill: Boolean = true;
    isColorful: Boolean = true;
    isCulling: Boolean = true;

    constructor(center: Point, scale: number, style: string, elms: NodeList) {
        super(center, scale, style);
        this.isModels = elms;
    }

    // モデルデータの生成
    createModel(modelObject: any) {
        this.modelData = new ModelData();

        this.modelData.vertices = new Array();

        // 頂点データ
        if (modelObject.morphTargets !== undefined) {
            // アニメーション分
            this.animeLength = modelObject.morphTargets.length;
            for (var j = 0; j < this.animeLength; j++) {
                this.modelData.vertices[j] = new Array();
                for (var i = 0; i < modelObject.morphTargets[j].vertices.length; i++) {
                    this.modelData.vertices[j].push(modelObject.morphTargets[j].vertices[i]);
                }
            }
        }
        else {
            // アニメーションなし
            this.animeLength = 1;
            this.modelData.vertices[0] = new Array();
            for (var i = 0; i < modelObject.vertices.length; i++) {
                this.modelData.vertices[0].push(modelObject.vertices[i]);
            }
        }

        // 面データ
        this.modelData.faces = new Array();
        for (var i = 0; i < modelObject.faces.length; i++) {
            this.modelData.faces.push(modelObject.faces[i]);
        }

        // 色データ
        this.hasColor = false;
        if (modelObject.morphColors !== undefined) {
            this.hasColor = true;
            this.modelData.colors = new Array();
            for (var i = 0; i < modelObject.morphColors[0].colors.length; i+=3) {
                var r: number = modelObject.morphColors[0].colors[i + 0];
                var g: number = modelObject.morphColors[0].colors[i + 1];
                var b: number = modelObject.morphColors[0].colors[i + 2];

                this.modelData.colors.push(this.getColorHexString(r,g,b));
            }
        }
    }

    // ビットチェック
    isBitSet(value, position) {
        return value & (1 << position);
    }

    // モデルデータの設定
    setModelData(idx:number) {
        this.vertices = []; 		// 頂点列を初期化
        this.faces = [];			// 面列を初期化
        var minV = new Vertex(10000, 10000, 10000);
        var maxV = new Vertex(-10000, -10000, -10000);
        var models = [];
        var addfaces: number = 0;

        // トークンごとの読み込み
        for (var i = 0; i < this.modelData.vertices[idx].length; i += 3) {
            var x = this.modelData.vertices[idx][i + 0];
            var y = this.modelData.vertices[idx][i + 1];
            var z = this.modelData.vertices[idx][i + 2];

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

        // THREE.JSONLoader.createModel の超簡易版
        var j = 0;
        for (var i = 0; i < this.modelData.faces.length; i += 8) {
            // 先頭データはType(10=00001010) 例 10,v0,v1,v2,0,fv0,fv1,fv2  
            if (this.modelData.faces[i] != 10) {
                continue;
            }
            // 頂点インデックスの取得 3頂点のみ対応
            var v0 = this.modelData.faces[i + 1];
            var v1 = this.modelData.faces[i + 2];
            var v2 = this.modelData.faces[i + 3];

            // 面列に新しい面を追加f
            this.faces.push(new Face(this.vertices[v0 + addfaces],
                                     this.vertices[v1 + addfaces],
                                     this.vertices[v2 + addfaces],
                                     this.modelData.colors[j++]));
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
                if (this.isColorful && this.hasColor) {
                    // フルカラー
                    var col = this.setHex(parseInt(face.color, 16));
                    var hsv = this.RGBtoHSV(col.r, col.g, col.b, false);
                    var rgb = this.HSVtoRGB(hsv.h, hsv.s, hsv.v - Math.round((1 - face.nz) * 50));
                }
                else {
                    // 単色
                    var rgb = this.HSVtoRGB(0.4 * 360, 0.5 * 255, face.nz * 255);
                }
                g.fillStyle = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';     // 面の塗りつぶし
                g.fill();
            }
        }
    }

    setHex(hex:number) {

        hex = Math.floor(hex);

        var r: number = (hex >> 16 & 255);
        var g: number = (hex >> 8 & 255);
        var b: number = (hex & 255);

        return { 'r': r, 'g': g, 'b': b };
    }

    getColorHex(r:number, g:number, b:number):number {

        return (r * 255) << 16 ^ (g * 255) << 8 ^ (b * 255) << 0;
	}

    getColorHexString(r: number, g: number, b: number):string {

        return ('000000' + this.getColorHex(r, g, b).toString(16)).slice(- 6);
	}

    RGBtoHSV(r: number, g: number, b: number, coneModel:boolean) {
        var h: number,              // 0..360
            s: number, v: number,   // 0..255
            max = Math.max(Math.max(r, g), b),
            min = Math.min(Math.min(r, g), b);

        // hue の計算
        if (max == min) {
            h = 0; // 本来は定義されないが、仮に0を代入
        } else if (max == r) {
            h = 60 * (g - b) / (max - min) + 0;
        } else if (max == g) {
            h = (60 * (b - r) / (max - min)) + 120;
        } else {
            h = (60 * (r - g) / (max - min)) + 240;
        }

        while (h < 0) {
            h += 360;
        }

        // saturation の計算
        if (coneModel) {
            // 円錐モデルの場合
            s = max - min;
        } else {
            s = (max == 0)
            ? 0 // 本来は定義されないが、仮に0を代入
            : (max - min) / max * 255;
        }

        // value の計算
        v = max;

        return { 'h': h, 's': s, 'v': v };
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
    private elmColorful: HTMLInputElement;
    private elmCulling: HTMLInputElement;
    private elmAxis: HTMLInputElement;
    private elmAxisCube: HTMLInputElement;
    private elmModels: NodeList;
    private elmSpeed: HTMLInputElement;

    private width: number;
    private height: number;
    private center: Point;
    private scale: number;
    private context: CanvasRenderingContext2D;
    private modelObj: ModelObject;
    private axisCube: AxisCube;
    private axis = [];
    private index = 0;
    private json;
    private frameCount = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d");
        this.width = canvas.width = 448;    //window.innerWidth;
        this.height = canvas.height = 448;  //window.innerHeight;
        this.mousePosition = new Point(this.width / 2, this.height / 2);

        this.elmWireFrame = <HTMLInputElement>document.getElementById('wireFrameCheck');
        this.elmFill = <HTMLInputElement>document.getElementById('fillCheck');
        this.elmColorful = <HTMLInputElement>document.getElementById('colorfulCheck');
        this.elmCulling = <HTMLInputElement>document.getElementById('cullingCheck');
        this.elmAxis = <HTMLInputElement>document.getElementById('axisCheck');
        this.elmAxisCube = <HTMLInputElement>document.getElementById('axisCubeCheck');
        this.elmModels = <NodeList>document.getElementsByName('models');
        this.elmSpeed = <HTMLInputElement>document.getElementById('speed');

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
        this.elmColorful.addEventListener("change", () => {
            this.modelObj.isColorful = this.elmColorful.checked;
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
        this.elmSpeed.addEventListener("change", () => {
            document.getElementById("speedDisp").innerHTML = this.elmSpeed.value;
        });

        for (var i = 0; i < this.elmModels.length; i++) {
            this.elmModels[i].addEventListener("change", () => {
                this.changeModelData();
            });
        }

        this.axisCube = new AxisCube(this.center, this.scale, 'darkgray');

        // 軸 立方体より少しはみ出すために1.2倍長くする
        this.axis.push(new Axis(this.center, this.scale * 1.2, 'blue', 'x'));
        this.axis.push(new Axis(this.center, this.scale * 1.2, 'green', 'y'));
        this.axis.push(new Axis(this.center, this.scale * 1.2, 'red', 'z'));

        // モデルデータ読込
        this.changeModelData();
    }

    // モデルデータロード完了
    changeModelData() {
        var dict: { key?: string; } = {};
        dict["horse"] = "horse.js";         // 馬
        dict["flamingo"] = "flamingo.js";   // フラミンゴ
        dict["stork"] = "stork.js";         // コウノトリ
        dict["parrot"] = "parrot.js";       // オウム

        for (var i = 0; i < this.elmModels.length; i++) {
            var elm: HTMLInputElement = <HTMLInputElement>this.elmModels[i];
            if (elm.checked) {
                // モデルデータ読込
                this.index = 0;
                this.frameCount = 0;
                this.JSONLoader(dict[elm.value], (() => this.onJSONLoaded()));
                break;
            }
        }
    }

    // モデルデータロード完了
    onJSONLoaded() {

        // モデルデータの生成
        this.modelObj.createModel(this.json);

        // モデルデータの設定
        this.modelObj.setModelData(this.index);

        // 描画
        this.render();

        // タイマー
        setInterval((() => this.onFrame()), 1000 / 60);
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

    // 毎回フレーム
    onFrame() {
        if ((this.frameCount % (Number(this.elmSpeed.value) * 3)) == 0) {
            this.frameCount = 0;
            // モデルデータの設定
            this.modelObj.setModelData(this.index);
            this.index++;
            this.index %= this.modelObj.animeLength;
        }
        this.render();
        this.frameCount++;
    }

    // モデルJSONデータ読み込み
    JSONLoader(file, callback: Function) {
        var x = new XMLHttpRequest();

        x.open('GET', file);
        x.onreadystatechange = () => {
            if (x.readyState == 4) {
                this.json = JSON.parse(x.responseText);
                // 読込完了コールバック
                callback();
            }
        }
        x.send();
    }
}

window.onload = () => {
    var app = new Study3DApp(<HTMLCanvasElement>document.getElementById('content'));
};
