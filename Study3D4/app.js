var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
    function Face(v0, v1, v2, c) {
        this.v = [];
        this.z = 0;
        this.nx = 0;
        this.ny = 0;
        this.nz = 0;
        this.color = "#000000";
        this.v.push(v0);
        this.v.push(v1);
        this.v.push(v2);
        this.color = c;
    }
    return Face;
})();

// 平面クラス
var Plane = (function () {
    function Plane(center, scale, style) {
        this.center = center;
        this.scale = scale;
        this.style = style;
        this.p = [];
        this.vertices = [];
    }
    // 頂点のスクリーン座標を更新する
    Plane.prototype.setScreenPosition = function (theta, phi) {
        this.p = [];
        for (var i = 0; i < this.vertices.length; i++) {
            var v = this.vertices[i];

            // 回転後の座標値の算出
            v.rx = v.x * Math.cos(theta) + v.z * Math.sin(theta);
            v.ry = v.x * Math.sin(phi) * Math.sin(theta) + v.y * Math.cos(phi) - v.z * Math.sin(phi) * Math.cos(theta);
            v.rz = -v.x * Math.cos(phi) * Math.sin(theta) + v.y * Math.sin(phi) + v.z * Math.cos(phi) * Math.cos(theta);

            // スクリーン座標の算出
            v.screenX = this.center.x + this.scale * v.rx;
            v.screenY = this.center.y - this.scale * v.ry;

            // 回転後の各頂点の座標を計算
            this.p.push(new Point(v.screenX, v.screenY));
        }
    };

    // 描画処理
    Plane.prototype.draw = function (g, p1, p2) {
        g.beginPath();
        g.lineWidth = 0.5;
        g.moveTo(p1.x, p1.y);
        g.lineTo(p2.x, p2.y);
        g.closePath();
        g.strokeStyle = this.style;
        g.stroke();
    };
    return Plane;
})();

// 軸クラス
var Axis = (function (_super) {
    __extends(Axis, _super);
    function Axis(center, scale, style, ax) {
        _super.call(this, center, scale, style);

        var vertice = [];

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

        for (var i = 0; i < vertice.length; i++) {
            var v = new Vertex(vertice[i][0], vertice[i][1], vertice[i][2]);
            this.vertices.push(v);
        }
    }
    // 軸描画処理
    Axis.prototype.draw = function (g) {
        _super.prototype.draw.call(this, g, this.p[0], this.p[1]);
    };
    return Axis;
})(Plane);

// 立方体軸クラス
var AxisCube = (function (_super) {
    __extends(AxisCube, _super);
    function AxisCube(center, scale, style) {
        _super.call(this, center, scale, style);

        var diff = function (f) {
            return f ? 1 : -1;
        };

        for (var i = 0; i < 8; i++) {
            var v = new Vertex(diff(i % 4 % 3 == 0), diff(i % 4 < 2), diff(i < 4));
            this.vertices.push(v);
        }
    }
    AxisCube.prototype.draw = function (g) {
        for (var i = 0; i < 4; i++) {
            _super.prototype.draw.call(this, g, this.p[i], this.p[i + 4]);
            _super.prototype.draw.call(this, g, this.p[i], this.p[(i + 1) % 4]);
            _super.prototype.draw.call(this, g, this.p[i + 4], this.p[(i + 1) % 4 + 4]);
        }
    };
    return AxisCube;
})(Plane);

// インターフェイスの定義
var ModelData = (function () {
    function ModelData() {
    }
    return ModelData;
})();

// モデルオブジェクトクラス
var ModelObject = (function (_super) {
    __extends(ModelObject, _super);
    function ModelObject(center, scale, style, elms) {
        _super.call(this, center, scale, style);
        this.faces = [];
        this.isWireFrame = true;
        this.isFill = true;
        this.isColorful = true;
        this.isCulling = true;
        this.isModels = elms;
    }
    // モデルデータの生成
    ModelObject.prototype.createModel = function (modelObject) {
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
        } else {
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
            for (var i = 0; i < modelObject.morphColors[0].colors.length; i += 3) {
                var r = modelObject.morphColors[0].colors[i + 0];
                var g = modelObject.morphColors[0].colors[i + 1];
                var b = modelObject.morphColors[0].colors[i + 2];

                this.modelData.colors.push(this.getColorHexString(r, g, b));
            }
        }
    };

    // ビットチェック
    ModelObject.prototype.isBitSet = function (value, position) {
        return value & (1 << position);
    };

    // モデルデータの設定
    ModelObject.prototype.setModelData = function (idx) {
        this.vertices = []; // 頂点列を初期化
        this.faces = []; // 面列を初期化
        var minV = new Vertex(10000, 10000, 10000);
        var maxV = new Vertex(-10000, -10000, -10000);
        var models = [];
        var addfaces = 0;

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

            // 面列に新しい面を追加
            this.faces.push(new Face(this.vertices[v0 + addfaces], this.vertices[v1 + addfaces], this.vertices[v2 + addfaces], this.modelData.colors[j++]));
        }

        var modelSize = Math.max(maxV.x - minV.x, maxV.y - minV.y);
        modelSize = Math.max(modelSize, maxV.z - minV.z);

        for (var i = 0; i < this.vertices.length; i++) {
            var v = this.vertices[i];
            v.x = (v.x - (minV.x + maxV.x) / 2) / modelSize * 2;
            v.y = (v.y - (minV.y + maxV.y) / 2) / modelSize * 2;
            v.z = (v.z - (minV.z + maxV.z) / 2) / modelSize * 2;
        }
    };

    // 頂点のスクリーン座標を更新する
    ModelObject.prototype.setScreenPosition = function (theta, phi) {
        _super.prototype.setScreenPosition.call(this, theta, phi);

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
    ModelObject.prototype.isFace = function (p1, p2, p3) {
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
    ModelObject.prototype.draw = function (g) {
        // 三角形描画のための座標値を格納する配列
        var px = [];
        var py = [];

        for (var i = 0; i < this.faces.length; i++) {
            var face = this.faces[i];
            var pt1 = new Point(face.v[0].screenX, face.v[0].screenY);
            var pt2 = new Point(face.v[1].screenX, face.v[1].screenY);
            var pt3 = new Point(face.v[2].screenX, face.v[2].screenY);

            // カリング(隠面は描画しない)
            if (this.isCulling) {
                // 裏表を三角形頂点の配置順序で判定(時計回り以外なら描画しない)
                if (this.isFace(pt1, pt2, pt3) <= 0)
                    continue;
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
                } else {
                    // 単色
                    var rgb = this.HSVtoRGB(0.4 * 360, 0.5 * 255, face.nz * 255);
                }
                g.fillStyle = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')'; // 面の塗りつぶし
                g.fill();
            }
        }
    };

    ModelObject.prototype.setHex = function (hex) {
        hex = Math.floor(hex);

        var r = (hex >> 16 & 255);
        var g = (hex >> 8 & 255);
        var b = (hex & 255);

        return { 'r': r, 'g': g, 'b': b };
    };

    ModelObject.prototype.getColorHex = function (r, g, b) {
        return (r * 255) << 16 ^ (g * 255) << 8 ^ (b * 255) << 0;
    };

    ModelObject.prototype.getColorHexString = function (r, g, b) {
        return ('000000' + this.getColorHex(r, g, b).toString(16)).slice(-6);
    };

    ModelObject.prototype.RGBtoHSV = function (r, g, b, coneModel) {
        var h, s, v, max = Math.max(Math.max(r, g), b), min = Math.min(Math.min(r, g), b);

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
            s = (max == 0) ? 0 : (max - min) / max * 255;
        }

        // value の計算
        v = max;

        return { 'h': h, 's': s, 'v': v };
    };

    // HSBからRGB変換
    ModelObject.prototype.HSVtoRGB = function (h, s, v) {
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
    return ModelObject;
})(Plane);

// メインクラス
var Study3DApp = (function () {
    function Study3DApp(canvas) {
        var _this = this;
        this.phi = 0.30;
        this.theta = 0.50;
        this.isDrag = false;
        this.axis = [];
        this.index = 0;
        this.frameCount = 0;
        this.context = canvas.getContext("2d");
        this.width = canvas.width = 448; //window.innerWidth;
        this.height = canvas.height = 448; //window.innerHeight;
        this.mousePosition = new Point(this.width / 2, this.height / 2);

        this.elmWireFrame = document.getElementById('wireFrameCheck');
        this.elmFill = document.getElementById('fillCheck');
        this.elmColorful = document.getElementById('colorfulCheck');
        this.elmCulling = document.getElementById('cullingCheck');
        this.elmAxis = document.getElementById('axisCheck');
        this.elmAxisCube = document.getElementById('axisCubeCheck');
        this.elmModels = document.getElementsByName('models');
        this.elmSpeed = document.getElementById('speed');

        // 中央位置の設定
        this.center = new Point(this.width / 2, this.height / 2);

        // 描画スケールの設定
        this.scale = this.width * 0.6 / 2;
        this.modelObj = new ModelObject(this.center, this.scale, 'black', this.elmModels);

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

            // 描画
            _this.render();
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

        // 各チェックボックス変更
        this.elmWireFrame.addEventListener("change", function () {
            _this.modelObj.isWireFrame = _this.elmWireFrame.checked;
            _this.render();
        });
        this.elmFill.addEventListener("change", function () {
            _this.modelObj.isFill = _this.elmFill.checked;
            _this.render();
        });
        this.elmColorful.addEventListener("change", function () {
            _this.modelObj.isColorful = _this.elmColorful.checked;
            _this.render();
        });
        this.elmCulling.addEventListener("change", function () {
            _this.modelObj.isCulling = _this.elmCulling.checked;
            _this.render();
        });
        this.elmAxis.addEventListener("change", function () {
            _this.render();
        });
        this.elmAxisCube.addEventListener("change", function () {
            _this.render();
        });
        this.elmSpeed.addEventListener("change", function () {
            document.getElementById("speedDisp").innerHTML = _this.elmSpeed.value;
        });

        for (var i = 0; i < this.elmModels.length; i++) {
            this.elmModels[i].addEventListener("change", function () {
                _this.changeModelData();
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
    Study3DApp.prototype.changeModelData = function () {
        var _this = this;
        var dict = {};
        dict["horse"] = "horse.js"; // 馬
        dict["flamingo"] = "flamingo.js"; // フラミンゴ
        dict["stork"] = "stork.js"; // コウノトリ
        dict["parrot"] = "parrot.js"; // オウム

        for (var i = 0; i < this.elmModels.length; i++) {
            var elm = this.elmModels[i];
            if (elm.checked) {
                // モデルデータ読込
                this.index = 0;
                this.frameCount = 0;
                this.JSONLoader(dict[elm.value], (function () {
                    return _this.onJSONLoaded();
                }));
                break;
            }
        }
    };

    // モデルデータロード完了
    Study3DApp.prototype.onJSONLoaded = function () {
        var _this = this;
        // モデルデータの生成
        this.modelObj.createModel(this.json);

        // モデルデータの設定
        this.modelObj.setModelData(this.index);

        // 描画
        this.render();

        // タイマー
        setInterval((function () {
            return _this.onFrame();
        }), 1000 / 60);
    };

    // 情報表示
    Study3DApp.prototype.drawInfo = function () {
        var elm = document.getElementById("info");
        elm.innerText = 'theta: ' + this.theta.toFixed(2) + ' / phi: ' + this.phi.toFixed(2);
    };

    // 描画クリア
    Study3DApp.prototype.drawClear = function (g) {
        g.beginPath();
        g.fillStyle = 'aliceblue';
        g.fillRect(0, 0, this.width, this.height);
    };

    // 描画
    Study3DApp.prototype.render = function () {
        var g = this.context;

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
            for (var i = 0; i < this.axis.length; i++) {
                this.axis[i].setScreenPosition(this.theta, this.phi);
                this.axis[i].draw(g);
            }
        }

        // 情報表示
        this.drawInfo();
    };

    // 毎回フレーム
    Study3DApp.prototype.onFrame = function () {
        if ((this.frameCount % (Number(this.elmSpeed.value) * 3)) == 0) {
            this.frameCount = 0;

            // モデルデータの設定
            this.modelObj.setModelData(this.index);
            this.index++;
            this.index %= this.modelObj.animeLength;
        }
        this.render();
        this.frameCount++;
    };

    // モデルJSONデータ読み込み
    Study3DApp.prototype.JSONLoader = function (file, callback) {
        var _this = this;
        var x = new XMLHttpRequest();

        x.open('GET', file);
        x.onreadystatechange = function () {
            if (x.readyState == 4) {
                _this.json = JSON.parse(x.responseText);

                // 読込完了コールバック
                callback();
            }
        };
        x.send();
    };
    return Study3DApp;
})();

window.onload = function () {
    var app = new Study3DApp(document.getElementById('content'));
};
//# sourceMappingURL=app.js.map
