//Глобальные размеры
var glob_width = 0;
var glob_height = 0;

//Класс КОНСТРУКТОР ОТКОСА
function Draw() {
    var S = Snap("#mysvg");
    //Эти три строчки для преобразования координат svg что бы координаты мышки были равны координатам svg холста а не всего экрана
    var mySvg = $("#mysvg")[0];
    var pt = mySvg.createSVGPoint(); // create the point;
    var transformed;

    this.S = S;
    //холст
    var Points = [0, 0, S.node.clientWidth, 0, S.node.clientWidth, S.node.clientHeight, 0, S.node.clientHeight];
    S.polygon().attr({
        points: Points,
        fill: "#f9f9f9",
        id: "canvas"
    });

    glob_width = S.node.clientWidth;
    glob_height = S.node.clientHeight;


    this.run = function () {
        console.log('Run main');
    };

    this.remove = function () {
        $('#mysvg').remove();
        $("#pnl1").append("<svg id=mysvg></svg>");
    };


    //Массив с линиями
    var gLines = [];
    this.gLines = gLines;
    //Массив с текстом углов
    var gAngles = []
    this.gAngles = gAngles;
    //Массив с текстом длины линий
    var gLineLengths = []
    this.gLineLengths = gLineLengths;
    //Флаги о включенных линиях покраски
    var topPainted = false;
    var botPainted = false;
    this.topPainted = topPainted;
    this.botPainted = botPainted;
    //Флаги о включенных подгибах
    var podgibLeftTop = false;
    var podgibLeftBottom = false;
    var podgibRightTop = false;
    var podgibRightBottom = false;
    //Координаты мыши, переприсваиваются всегда при движении по холсту S
    var mouseX;
    var mouseY;
    //Первые и средние координаты векторов (middleX,middleY Это общая точка двух векторов)
    var firstX;
    var firstY;
    var middleX;
    var middleY;
    //Комплект рисования: линия, текст угла, текст длины
    var line;
    var textAngle;
    var textLength;
    //Начало рисования, первая левая точка линии берется статично
    var firstDraw = true;
    var firstClick = false;
    //Если true показываем только длину, если false то длину и угол
    var firstText = true;
    //Текст
    var lineLength;
    var angle = 0;
    //Подтверждение конца рисования
    var finished = false;
    this.finished = finished;
    //максимальна возможная длина и текущая максималная
    var maxLength = 1250;
    var lengthSumm = 0;
    this.lengthSumm = lengthSumm;
    //Массив с путями линий для проверки на пересечение
    var vectorPathes = [];
    var lastPath;
    // группа линий
    var gLinesGroup = S.group();
    // массив с биссектрисами углов
    var angleLines = [];
    // массив с углами
    var angleArr = [];
    //Флаги о включенных линиях покраски
    var topPainted = false;
    var botPainted = false;
    //Флаги о включенных подгибах
    var podgibLeftTop = false;
    var podgibLeftBottom = false;
    var podgibRightTop = false;
    var podgibRightBottom = false;
    //Линии подгиба
    var linePodgibLeft;
    var linePodgibRight;
    //Линии покраски
    var linePaintedTop;
    var linePaintedBot;
    //Массив с объектами Текст длины
    var arrTxt;
    // коэфф на который следует увеличить рисунок (в размер холста), рассчитывается при окончании рисования
    var minK; 

    //Параметры.......................................:
    //Отступ линий покраски
    var otstyp = 3;
    //Ширина основной линнии
    var widthMainLine = 2;
    //Ширина линий покраски
    var widthLinePainted = 2;
    //Частота штриха основной линии
    var dashMainLine = 5;
    //Частота штриха линий покраски
    var dashLinePainted = 5;
    //Отступ текста размеров
    var otstypText = 6;
    //................................................

    //При наведении на линию показываем красный
    function addRed() {
        if (ConstrDraw.finished) {
            //Показываем курсор
            document.body.style.cursor = 'pointer';
            this.attr({ stroke: "red" });
        }
    };

    //При ухода с линии показываем черный
    function addBlack() {
        if (ConstrDraw.finished) {
            //Показываем стрелку
            document.body.style.cursor = 'default';
            this.attr({ stroke: "black" });
        }
    };

    //Находим угол между векторами
    function getAngleFromTwoVectors(x1, y1, x2, y2, x3, y3) {
        //Найдем вектора по координатам точек двух отрезков:
        var vectors = [{ x: x2 - x1, y: y2 - y1 }, { x: x3 - x2, y: y3 - y2 }];
        //Угол получаем от 0 до Pi(умножая на 180 и деля на pi получаем градусы) бралось отсюда http://math.ivanovo.ac.ru/dalgebra/Khashin/gr/cos/cos.html
        var angle = (vectors[0].x * vectors[1].x + vectors[0].y * vectors[1].y) / (Math.sqrt(vectors[0].x * vectors[0].x + vectors[0].y * vectors[0].y) * Math.sqrt(vectors[1].x * vectors[1].x + vectors[1].y * vectors[1].y));
        if (angle < -1) t = -1;
        else if (angle > 1) t = 1;
        return Math.round(Math.acos(-angle) * 180 / Math.PI);
    }


    //Рисуем новую линию
    function createNew() {
        //первый запуск
        if (firstDraw) {
            //Очищаем массив при рисовании первой линии
            vectorPathes = [];
            middleX = mouseX;
            middleY = mouseY;
            lineLength = Math.round(Math.sqrt(Math.pow(mouseX - mouseX, 2) + Math.pow(mouseY - mouseY, 2)));              //пунктир ширина
            line = S.line(mouseX, mouseY, mouseX, mouseY).attr({ stroke: "black", strokeWidth: widthMainLine, strokeLinecap: "round", strokeDasharray: dashMainLine });
            line.hover(addRed, addBlack);
            line.click(clickCallbackLine);
            textLength = S.text(mouseX - 5, mouseY + 20, "Длина: " + lineLength + "мм");
            firstDraw = false;
        } else {
            var intersection = false;
            //Просто запоминаем данные firstX и firstY для дальнейшего восстановления при пересечении 
            var savedfirstX = firstX;
            var savedfirstY = firstY;
            var lastlineLength = lineLength;
            //Сохраняем первую точку
            firstX = middleX;
            firstY = middleY;
            //Сохраняем среднюю точку, последняя точка это будет координаты mouseX и mouseY
            middleX = mouseX;
            middleY = mouseY;

            //Запоминаем предыдущий путь
            lastPath = "M" + firstX + "," + firstY + "L" + middleX + "," + middleY;

            //Проверяем текущий путь на пересечения с предыдущими путями сохраненными в массиве
            if (vectorPathes.length > 0) {
                for (var i = 0; i < vectorPathes.length; i++) {
                    if (typeof (vectorPathes[i]) !== 'undefined') {
                        //Получили точки пересечения
                        var arr = Snap.path.intersection(vectorPathes[i], lastPath);
                        //Пройдем по массиву и округлим все координаты
                        for (var j = 0; j < arr.length; j++) {
                            arr[j].x = Math.round(arr[j].x);
                            arr[j].y = Math.round(arr[j].y);
                        }
                        //Убираем дубли
                        if (arr.length > 0) {
                            result = arr.filter(function (a) {
                                var key = a.x + '|' + a.y;
                                if (!this[key]) {
                                    this[key] = true;
                                    return true;
                                }
                            }, Object.create(null));
                            //Проверяем, не является ли точка пересечения общей точкой
                            if ((result[0].x != firstX) || (result[0].y != firstY)) {
                                intersection = true;
                                //Если нашли хоть одно пересечение выходим, нет смысла искать дальше
                                break;
                            }
                        }
                    }
                }
            }

            //Суммируем длину всех отрезков
            ConstrDraw.lengthSumm += lineLength;
            //Делаем проверку на первую линию
            if ((vectorPathes.length == 0) && (angle == 0)) {
                //Ставим углу любое число
                angle = 1;
            }
            //Если не пересекаются то рисуем новый комплект
            if ((!intersection) && (ConstrDraw.lengthSumm < maxLength) && (angle != 0)) {
                //Убираем пунктир
                line.attr({ strokeDasharray: 0 });
                //Сохраняем массив с линиями для перерисовки
                gLinesGroup.append(line);
                gLines.push(line);
                //Сохраняем массив с текстом углов
                gAngles.push(angle);
                //Сохраняем массив с текстом длин линий
                gLineLengths.push(lineLength);
                //Стираем предыдущий текст после каждого клика
                if (textLength != undefined) {
                    textLength.remove();
                }
                if (textAngle != undefined) {
                    textAngle.remove();
                }

                line = S.line(mouseX, mouseY, mouseX, mouseY).attr({ stroke: "black", strokeWidth: widthMainLine, strokeLinecap: "round", strokeDasharray: dashMainLine });
                line.hover(addRed, addBlack);
                line.click(clickCallbackLine);
                textAngle = S.text(mouseX - 5, mouseY + 20, "Угол: " + angle + "\u00B0");
                textLength = S.text(mouseX - 5, mouseY + 35, "Длина: " + lineLength + "мм");

                //Рисуем угол
                if ((angle != 0) && (vectorPathes.length > 0)) {

                    var p1x = parseInt(gLines[gLines.length - 1].attr('x2'), 10);
                    var p1y = parseInt(gLines[gLines.length - 1].attr('y2'), 10);
                    var p2x = parseInt(gLines[gLines.length - 1].attr('x1'), 10);
                    var p2y = parseInt(gLines[gLines.length - 1].attr('y1'), 10);
                    var vectorLen = Math.sqrt((p1x - p2x) * (p1x - p2x) + (p1y - p2y) * (p1y - p2y));
                    var angleSkoba = 30;
                    var alpha = vectorLen / angleSkoba;
                    var xZasech = (p1x + alpha * p2x) / (1 + alpha);
                    var yZasech = (p1y + alpha * p2y) / (1 + alpha);

                    var p1x2 = parseInt(gLines[gLines.length - 2].attr('x1'), 10);
                    var p1y2 = parseInt(gLines[gLines.length - 2].attr('y1'), 10);
                    var p2x2 = parseInt(gLines[gLines.length - 2].attr('x2'), 10);
                    var p2y2 = parseInt(gLines[gLines.length - 2].attr('y2'), 10);
                    var vectorLen2 = Math.sqrt((p1x2 - p2x2) * (p1x2 - p2x2) + (p1y2 - p2y2) * (p1y2 - p2y2));
                    var alpha2 = vectorLen2 / angleSkoba;
                    var xZasech2 = (p1x2 + alpha2 * p2x2) / (1 + alpha2);
                    var yZasech2 = (p1y2 + alpha2 * p2y2) / (1 + alpha2);

                    var biss = S.line(p2x, p2y, ((xZasech + xZasech2) / 2), ((yZasech + yZasech2) / 2)).attr({ stroke: 'none', strokeWidth: "1", angle: angle });
                    angleLines.push(biss);
                    gLinesGroup.append(biss);
                }

                //Сохраняем в массив путей, другие линии будем проверять с этим массивом на пересечения путей
                vectorPathes.push(lastPath);
                //Даем возможность показать текст угла
                firstText = false;
            } else {
                if (intersection) {
                    console.log('Пересечение.');
                }

                if (ConstrDraw.lengthSumm > maxLength) {
                    console.log('Длина более ' + maxLength + 'мм.');
                }

                if (angle == 0) {
                    console.log('Угол 0 градусов');
                }

                //При пересечении возвращаем старые значения
                middleX = firstX;
                middleY = firstY;
                firstX = savedfirstX;
                firstY = savedfirstY;
                //Из общей длины вычитаем последний отрезок который выдал ошибку, так как физически его не нарисовали
                ConstrDraw.lengthSumm -= lastlineLength;
            }
        }
        //Флаг о первом клике в холст, что можно начать пересчет при движении мышки...
        firstClick = true;
    }

    //Создаем новое рисование или продолжаем 
    clickCallbackSnap = function (event) {
        if (!ConstrDraw.finished) {
            //Убираем курсор
            // document.body.style.cursor = 'none';
            //Создаем новый комплект
            createNew();
        }
    };
    S.click(clickCallbackSnap);

    // Обработчик клика по элементу "Линия"
    var clickCallbackLine = function (event) {
        if (ConstrDraw.finished) {
            //Старая длина отрезка
            var lenAB = Math.round(Math.sqrt(Math.pow(this.attr('x2') - this.attr('x1'), 2) + Math.pow(this.attr('y2') - this.attr('y1'), 2)));
            var length = prompt("Введите новую длинну...", "");
            //Проверяем на новую длину, она должна быть меньше максимальной что бы произвести увеличение или уменьшение отрезка
            var newLength = (ConstrDraw.lengthSumm - lenAB) + parseInt(length);
            if (newLength < maxLength) {
                ConstrDraw.lengthSumm = newLength;
                //Запоминаем координаты конца отрезка по которому кликнули
                var lastx2 = parseInt(this.attr('x2'));
                var lasty2 = parseInt(this.attr('y2'));
                //Новые координаты конца вектора после увеличения длины
                length = length - lenAB;
                var xz = Math.round(parseInt(this.attr('x2')) + (parseInt(this.attr('x2')) - parseInt(this.attr('x1'))) / lenAB * length);
                var yz = Math.round(parseInt(this.attr('y2')) + (parseInt(this.attr('y2')) - parseInt(this.attr('y1'))) / lenAB * length);
                //Нужно перерисовать соседний элемент при этом сохраняя углы
                //Зная начало вектора, длину  и угол к можно расчитать вторую точку по теореме синусов
                if (gLines.length > 0) {
                    for (var i = 0; i < gLines.length; i++) {
                        if ((parseInt(gLines[i].attr('x2')) == lastx2) && (parseInt(gLines[i].attr('y2')) == lasty2)) {
                            if (i < gLines.length) {
                                //Меняем конец отрезка который увеличили
                                if (gLines[i] != undefined) {
                                    gLines[i].attr({ 'x2': xz, 'y2': yz });
                                }
                                //Проходим по  остальным отрезкам и увеличить их начальные и конечные координаты, для смещения
                                var idx = i + 1;
                                for (var k = idx; k < gLines.length; k++) {
                                    //Координаты начала
                                    var cx1 = parseInt(gLines[k].attr('x1')) + (xz - lastx2);
                                    var cy1 = parseInt(gLines[k].attr('y1')) + (yz - lasty2);
                                    //Координаты конца
                                    var cx2 = parseInt(gLines[k].attr('x2')) + (xz - lastx2);
                                    var cy2 = parseInt(gLines[k].attr('y2')) + (yz - lasty2);
                                    //Перерисовываем меняя атрибуты
                                    gLines[k].attr({ 'x1': cx1, 'y1': cy1, 'x2': cx2, 'y2': cy2 });
                                }
                                //В зависимости от флага перерисовываем линии покраски если они были включены
                                if (ConstrDraw.topPainted) {
                                    linePaintedTop.remove();
                                    linePaintedTop = drawRedLines(gLines, 1);
                                }
                                if (ConstrDraw.botPainted) {
                                    linePaintedBot.remove();
                                    linePaintedBot = drawRedLines(gLines, 2);
                                }
                                //Перерисовываем подгибы если были включены
                                //Подгиб слева
                                if (podgibLeftTop) {
                                    if (linePodgibLeft != undefined) { linePodgibLeft.remove(); }
                                    linePodgibLeft = drawPodgibs(gLines[0], 1, 'left');
                                } else if (podgibLeftBottom) {
                                    if (linePodgibLeft != undefined) { linePodgibLeft.remove(); }
                                    linePodgibLeft = drawPodgibs(gLines[0], 2, 'left');
                                }
                                //Подгиб справа
                                if (podgibRightTop) {
                                    if (linePodgibRight != undefined) { linePodgibRight.remove(); }
                                    linePodgibRight = drawPodgibs(gLines[gLines.length - 1], 1, 'right');
                                } else if (podgibRightBottom) {
                                    if (linePodgibRight != undefined) { linePodgibRight.remove(); }
                                    linePodgibRight = drawPodgibs(gLines[gLines.length - 1], 2, 'right');
                                }

                                //Расставляем текст по новым координатам
                                for (var z = 0; z < arrTxt.length; z++) {
                                    //Удаляем все старые тексты длин
                                    arrTxt[z].remove();
                                }
                                arrTxt = drawText(gLines, 1);
                                break;
                            }
                        }
                    }
                }
            } else {
                console.log('Длина более ' + maxLength + 'мм.');
            }
        }
    };

    //Функция движения мышки по холсту
    function moveFunc(ev, x, y) {
        //Начинаем движение только если кликнули в холст
        if (firstClick) {
            pt.x = x;
            pt.y = y;
            transformed = pt.matrixTransform(mySvg.getScreenCTM().inverse());

            line.attr({
                x2: transformed.x,
                y2: transformed.y
            });
            lineLength = Math.round(Math.sqrt(Math.pow(middleX - transformed.x, 2) + Math.pow(middleY - transformed.y, 2)));

            if (firstText) {
                textLength.attr({
                    x: transformed.x - 5,
                    y: transformed.y + 20,
                    text: "Длина: " + lineLength + "мм"
                });
            } else {
                angle = getAngleFromTwoVectors(firstX, firstY, middleX, middleY, transformed.x, transformed.y);
                textAngle.attr({
                    x: transformed.x - 5,
                    y: transformed.y + 20,
                    text: "Угол: " + angle + '\u00B0'
                });

                textLength.attr({
                    x: transformed.x - 5,
                    y: transformed.y + 35,
                    text: "Длина: " + lineLength + "мм"
                });
            }
        }
        pt.x = x;
        pt.y = y;
        transformed = pt.matrixTransform(mySvg.getScreenCTM().inverse());
        //Всегда переприсваиваем что бы иметь текущее положение мыши 
        mouseX = transformed.x;
        mouseY = transformed.y;
    };
    S.mousemove(moveFunc);

    //Завершаем рисование и отрисовываем полученные линии и тексты в правильном порядке
    this.drawFinish = function () {
        console.log('Finish');
        //Показываем курсор и rebootDraw() Только в случае когда тыкнули в холст только один первый раз
        document.body.style.cursor = 'default';
        
        //Убираем недорисованные элементы
        if (textAngle != undefined) {
            if (!this.finished) {
                line.remove();
                textAngle.remove();
                textLength.remove();
                firstClick = false;
                this.finished = true;
                imageCenterAndScale();
                arrTxt = drawText(gLines, 1);
                drawText(angleLines, 2);
                
            }
        } else {
            reboot();
        }
    }

    this.removeRightPodgibs = function () {
        if (linePodgibRight != undefined) { linePodgibRight.remove(); }
        podgibRightTop = false;
        podgibRightBottom = false;
    }

    this.drawPodgibRightLines = function (pos) {
        if (this.finished) {
            //Подгиб справа
            if (pos == 1) {
                podgibRightTop = true;
                podgibRightBottom = false;
                if (linePodgibRight != undefined) { linePodgibRight.remove(); }
                linePodgibRight = drawPodgibs(gLines[gLines.length - 1], 1, 'right');
            } else if (pos == 2) {
                podgibRightTop = false;
                podgibRightBottom = true;
                if (linePodgibRight != undefined) { linePodgibRight.remove(); }
                linePodgibRight = drawPodgibs(gLines[gLines.length - 1], 2, 'right');
            }
        }
    }


    this.removeLeftPodgibs = function () {
        if (linePodgibLeft != undefined) { linePodgibLeft.remove(); }
        podgibLeftTop = false;
        podgibLeftBottom = false;
    }


    this.drawPodgibLeftLines = function (pos) {
        if (this.finished) {
            //Подгиб слева
            if (pos == 1) {
                podgibLeftTop = true;
                podgibLeftBottom = false;
                if (linePodgibLeft != undefined) { linePodgibLeft.remove(); }
                linePodgibLeft = drawPodgibs(gLines[0], 1, 'left');
            } else if (pos == 2) {
                podgibLeftTop = false;
                podgibLeftBottom = true;
                if (linePodgibLeft != undefined) { linePodgibLeft.remove(); }
                linePodgibLeft = drawPodgibs(gLines[0], 2, 'left');
            }
        }
    }

    this.removeDrawPaintedLines = function () {
        if (linePaintedTop != undefined) { linePaintedTop.remove(); }
        if (linePaintedBot != undefined) { linePaintedBot.remove(); }
        this.topPainted = false;
        this.botPainted = false;
        //Обновляем 3D сцену
        Scene3D.drawScene3D(gLines, gLineLengths, gAngles);
    }

    this.drawPaintLines = function (pos) {
        if (this.finished) {
            //В зависимости от положения ставим флаги в положение включено и рисуем линии покраски
            if (pos == 1) {
                this.topPainted = true;
                this.botPainted = false;
                if (linePaintedTop != undefined) { linePaintedTop.remove(); }
                if (linePaintedBot != undefined) { linePaintedBot.remove(); }
                linePaintedTop = drawRedLines(gLines, 1);
            } else if (pos == 2) {
                this.botPainted = true;
                this.topPainted = false;
                if (linePaintedTop != undefined) { linePaintedTop.remove(); }
                if (linePaintedBot != undefined) { linePaintedBot.remove(); }
                linePaintedBot = drawRedLines(gLines, 2);
            } else if (pos == 3) {
                this.topPainted = true;
                if (linePaintedTop != undefined) { linePaintedTop.remove(); }
                linePaintedTop = drawRedLines(gLines, 1);
                this.botPainted = true;
                if (linePaintedBot != undefined) { linePaintedBot.remove(); }
                linePaintedBot = drawRedLines(gLines, 2);
            }
            Scene3D.drawScene3D(gLines, gLineLengths, gAngles);
        }
    }

    //Функция отрисовки сторон покраски
    function drawRedLines(l, position) {
        var points = [];
        var pathes = [];
        var path = "";
        var path1 = "";
        var x, y;
        var newX;
        var newY;
        var length;
        var lenAB;
        var xz, yz, xz2, yz2;
        //Проходим цисклом по всем линиям снаружи
        for (var i = 0; i < l.length; i++) {
            //Координаты начала начального вектора
            newX = l[i].attr('x1');
            newY = l[i].attr('y1');
            //Координаты конца перпедикулярного вектора такой же длины 1-сверху, 2-снизу
            if (position == 1) {
                x = parseInt(newX) + parseInt(l[i].attr('y2') - l[i].attr('y1'));
                y = parseInt(newY) + (-(l[i].attr('x2') - l[i].attr('x1')));
            } else if (position == 2) {
                x = parseInt(newX) - parseInt(l[i].attr('y2') - l[i].attr('y1'));
                y = parseInt(newY) - (-(l[i].attr('x2') - l[i].attr('x1')));
            }
            //Новая длина вектора
            length = otstyp;
            //Текущая длина вектора
            lenAB = Math.round(Math.sqrt(Math.pow(x - newX, 2) + Math.pow(y - newY, 2)));
            length = length - lenAB;
            //Новые координаты конца вектра учитывая новую длину
            xz = Math.round(x + (x - newX) / lenAB * length);
            yz = Math.round(y + (y - newY) / lenAB * length);

            //Координаты конца начального вектора
            newX = l[i].attr('x2');
            newY = l[i].attr('y2');
            //Координаты конца перпедикулярного вектора такой же длины 1-сверху, 2-снизу
            if (position == 1) {
                x = parseInt(newX) + parseInt(l[i].attr('y2') - l[i].attr('y1'));
                y = parseInt(newY) + (-(l[i].attr('x2') - l[i].attr('x1')));
            } else if (position == 2) {
                x = parseInt(newX) - parseInt(l[i].attr('y2') - l[i].attr('y1'));
                y = parseInt(newY) - (-(l[i].attr('x2') - l[i].attr('x1')));
            }
            length = otstyp;
            lenAB = Math.round(Math.sqrt(Math.pow(x - newX, 2) + Math.pow(y - newY, 2)));
            length = length - lenAB;
            xz2 = Math.round(x + (x - newX) / lenAB * length);
            yz2 = Math.round(y + (y - newY) / lenAB * length);

            //Путь прпендикулярного вектора к начальному
            path1 = "M" + xz + "," + yz + "L" + xz2 + "," + yz2;
            pathes.push(path1);

            points.push({ x1: xz, y1: yz, x2: xz2, y2: yz2 });
            if (i == 0) {
                path = path + "M" + xz + "," + yz + "L" + xz2 + "," + yz2;
            } else {
                path = path + "L" + xz + "," + yz + "L" + xz2 + "," + yz2;
            }
        }

        //Нужно проверить на пересечения пути, там где пересекаются ставить точку
        for (i = 0; i < pathes.length; i++) {
            var inters = Snap.path.intersection(pathes[i], pathes[i + 1]);
            if (inters[0] != undefined) {
                points[i].x2 = Math.round(inters[0].x);
                points[i].y2 = Math.round(inters[0].y);
                points[i + 1].x1 = Math.round(inters[0].x);
                points[i + 1].y1 = Math.round(inters[0].y);
            }
        }

        //В зависимости от новых точек меняем общий путь
        path = "";
        for (i = 0; i < points.length; i++) {
            if (i == 0) {
                path = path + "M" + points[i].x1 + "," + points[i].y1 + "L" + points[i].x2 + "," + points[i].y2;
            } else {
                path = path + "L" + points[i].x1 + "," + points[i].y1 + "L" + points[i].x2 + "," + points[i].y2;
            }
        }
        //Рисуем общий путь
        var linePainted = S.path(path).attr({ stroke: 'red', fill: 'none', strokeLinecap: "round", strokeWidth: widthLinePainted, strokeDasharray: dashLinePainted });
        linePainted.transform('s'+minK+','+minK+','+ S.node.clientWidth/2 + ',' + S.node.clientHeight/2 + '');
        return linePainted;
    }


    /*
    * отрисовка длин отрезков
    * и углов
    * l - массив с данными
    * p = 1 - отрисовка отрезков
    * p = 2 - углов
    */
    function drawText(l, p) {
        var x, y;
        var zbp;
        var length;
        var lenAB;
        var xz, yz;
        //находим длину линии
        var lineLength;
        //Ставим текст по центру линии
        var txt;
        var bbox;
        //Находим середину линии
        var halfLen;
        //Находим середину текста
        var dx;
        var pth;
        var arrTxt = [];
        for (var i = 0; i < l.length; i++) {
            xz = Math.round((parseInt(l[i].attr('x1')) + parseInt(l[i].attr('x2'))) / 2);
            yz = Math.round((parseInt(l[i].attr('y1')) + parseInt(l[i].attr('y2'))) / 2);
            //находим длину линии
            lineLength = Math.round(Math.sqrt(Math.pow(l[i].attr('x1') - l[i].attr('x2'), 2) + Math.pow(l[i].attr('y1') - l[i].attr('y2'), 2)));
            //Находим середину линии
            halfLen = Math.round(lineLength / 2);
            //Ставим текст по центру линии 
            if(p == 1){
                txt = S.text(xz, yz, Math.round(lineLength)).attr({ fontFamily: 'Calibri', fontSize: 12 });
            }
            else{
                txt = S.text(xz, yz, Math.round(l[i].attr('angle')) + "\u00B0").attr({ fontFamily: 'Calibri', fontSize: 10});
            }
            gLinesGroup.append(txt);
            arrTxt.push(txt);
            bbox = txt.getBBox();
            //Находим середину текста
            dx = Math.round(bbox.width / 2);
            dy = Math.round(bbox.height / 2);
            pth = S.path("M" + l[i].attr('x1') + "," + l[i].attr('y1') + "L" + l[i].attr('x2') + "," + l[i].attr('y2'));
            if (p == 1) {
                if (parseInt(l[i].attr('x2')) > parseInt(l[i].attr('x1'))) {
                    //Получаем новые координаты учитывая смещение на половину ширины текста
                    zbp = pth.getPointAtLength(halfLen - dx);
                    //Получаем новые координаты для текста
                    x = parseInt(zbp.x) + parseInt(l[i].attr('y2') - l[i].attr('y1'));
                    y = parseInt(zbp.y) + (-(l[i].attr('x2') - l[i].attr('x1')));
                    //Новая длина вектора
                    length = otstypText;
                    lenAB = Math.round(Math.sqrt(Math.pow(x - zbp.x, 2) + Math.pow(y - zbp.y, 2)));
                    length = length - lenAB;
                    //Новые координаты конца вектра учитывая новую длину
                    xz = Math.round(x + (x - zbp.x) / lenAB * length);
                    yz = Math.round(y + (y - zbp.y) / lenAB * length);

                    txt.attr({ 'x': xz, 'y': yz });
                    txt.transform("r" + (180 + Snap.angle(l[i].attr('x1'), l[i].attr('y1'), l[i].attr('x2'), l[i].attr('y2'))) + "," + xz + ',' + yz);

                } else if (parseInt(l[i].attr('x2')) < parseInt(l[i].attr('x1'))) {
                    zbp = pth.getPointAtLength(halfLen + dx);
                    //Получаем новые координаты для текста
                    x = parseInt(zbp.x) - parseInt(l[i].attr('y2') - l[i].attr('y1'));
                    y = parseInt(zbp.y) - (-(l[i].attr('x2') - l[i].attr('x1')));

                    //Новая длина вектора
                    length = otstypText;
                    lenAB = Math.round(Math.sqrt(Math.pow(x - zbp.x, 2) + Math.pow(y - zbp.y, 2)));
                    length = length - lenAB;
                    //Новые координаты конца вектра учитывая новую длину
                    xz = Math.round(x + (x - zbp.x) / lenAB * length);
                    yz = Math.round(y + (y - zbp.y) / lenAB * length);

                    txt.attr({ 'x': xz, 'y': yz });
                    txt.transform("r" + (180 + Snap.angle(l[i].attr('x2'), l[i].attr('y2'), l[i].attr('x1'), l[i].attr('y1'))) + "," + xz + ',' + yz);
                }
            }
            // углы
            else{
                if (parseInt(l[i].attr('x2')) >= parseInt(l[i].attr('x1'))) {
                    if(parseInt(l[i].attr('y1')) >= parseInt(l[i].attr('y2'))) {
                        txt.attr({ 'x': (parseInt(l[i].attr('x2')) - dx), 'y': (parseInt(l[i].attr('y2')) + dy) });
                    }
                    else{
                        txt.attr({ 'x': (parseInt(l[i].attr('x2')) - dx), 'y': (parseInt(l[i].attr('y2')) + dy) });
                    }
                }
                else{
                    if(parseInt(l[i].attr('y1')) >= parseInt(l[i].attr('y2'))) {
                        txt.attr({ 'x': (parseInt(l[i].attr('x2')) - dx), 'y': (parseInt(l[i].attr('y2'))) });
                    }
                    else{
                        txt.attr({ 'x': (parseInt(l[i].attr('x2')) - dx), 'y': (parseInt(l[i].attr('y2'))) });
                    }
                }
                angleArr.push(txt);
            }
        }
        //Возвращаем массив с элементами текста
        return arrTxt;
    }

    //Находит максимум в массиве
    function maxOfArray(arr) {
        return Math.max.apply(Math, arr);
    }

    //Находит минимум в массиве
    function minOfArray(arr) {
        return Math.min.apply(Math, arr);
    }

    /*
    * центруем и масштабируем полученный рисунок
    */
    function imageCenterAndScale(){
        var x = [];
        var y = [];
        for (var i = 0; i < gLines.length; i++) {
            x.push(parseInt(gLines[i].attr('x1')));
            x.push(parseInt(gLines[i].attr('x2')));
            y.push(parseInt(gLines[i].attr('y1')));
            y.push(parseInt(gLines[i].attr('y2')));
        } 
        var xMin = minOfArray(x);
        var xMax = maxOfArray(x);
        var yMin = minOfArray(y);
        var yMax = maxOfArray(y);
        var holstCenterX = S.node.clientWidth/2;
        var holstCenterY = S.node.clientHeight/2;
        var imageCenterX = (xMax - xMin) / 2;
        var prirachX = holstCenterX - imageCenterX - xMin;
        var imageCenterY = (yMax - yMin) / 2;
        var prirachY = holstCenterY - imageCenterY - yMin;
        for (var i = 0; i < gLines.length; i++) {
            gLines[i].attr({ 'x1': (parseInt(gLines[i].attr('x1')) + prirachX)});
            gLines[i].attr({ 'x2': (parseInt(gLines[i].attr('x2')) + prirachX)});
            gLines[i].attr({ 'y1': (parseInt(gLines[i].attr('y1')) + prirachY)});
            gLines[i].attr({ 'y2': (parseInt(gLines[i].attr('y2')) + prirachY)});
        }
        for (var j = 0; j < angleLines.length; j++) {
            angleLines[j].attr({ 'x1': (parseInt(angleLines[j].attr('x1')) + prirachX)});
            angleLines[j].attr({ 'x2': (parseInt(angleLines[j].attr('x2')) + prirachX)});
            angleLines[j].attr({ 'y1': (parseInt(angleLines[j].attr('y1')) + prirachY)});
            angleLines[j].attr({ 'y2': (parseInt(angleLines[j].attr('y2')) + prirachY)});
        }
        var imageW = xMax - xMin;
        var imageH = yMax - yMin;
        var xKoeff = S.node.clientWidth / imageW;
        var yKoeff = S.node.clientHeight / imageH;
        minK = Math.min(xKoeff, yKoeff) - 0.1;

        // gLinesGroup.remove();
        gLinesGroup.transform('s'+minK+','+minK+','+ S.node.clientWidth/2 + ',' + S.node.clientHeight/2 + '');
    }
    



    function drawPodgibs(l, position, leftorright) {
        var x, y
        var newX, newY;
        if (leftorright == 'left') {
            newX = l.attr('x1');
            newY = l.attr('y1');
        } else if (leftorright == 'right') {
            newX = l.attr('x2');
            newY = l.attr('y2');
        }
        if (position == 1) {
            x = parseInt(newX) + parseInt(l.attr('y2') - l.attr('y1'));
            y = parseInt(newY) + (-(l.attr('x2') - l.attr('x1')));
        } else if (position == 2) {
            x = parseInt(newX) - parseInt(l.attr('y2') - l.attr('y1'));
            y = parseInt(newY) - (-(l.attr('x2') - l.attr('x1')));
        }
        //отступ дуги
        var length = 6;
        var lenAB = Math.round(Math.sqrt(Math.pow(x - newX, 2) + Math.pow(y - newY, 2)));
        length = length - lenAB;
        var xz = Math.round(x + (x - newX) / lenAB * length);
        var yz = Math.round(y + (y - newY) / lenAB * length);

        var path = "M" + l.attr('x1') + "," + l.attr('y1') + "L" + l.attr('x2') + "," + l.attr('y2');
        var path_ppp = S.path(path);

        //Закругление дуги
        var coords = path_ppp.getPointAtLength(4);
        if (leftorright == 'left') {
            coords = path_ppp.getPointAtLength(4);
        } else if (leftorright == 'right') {
            coords = path_ppp.getPointAtLength(lenAB - 4);
        }
        var begX = (newX * 2) - coords.x;
        var begY = (newY * 2) - coords.y;

        //Длина дуги
        coords = path_ppp.getPointAtLength(30);
        if (leftorright == 'left') {
            coords = path_ppp.getPointAtLength(30);
        } else if (leftorright == 'right') {
            coords = path_ppp.getPointAtLength(lenAB - 30);
        }

        var newX1 = coords.x
        var newY1 = coords.y
        if (position == 1) {
            x = parseInt(newX1) + parseInt(l.attr('y2') - l.attr('y1'));
            y = parseInt(newY1) + (-(l.attr('x2') - l.attr('x1')));
        } else if (position == 2) {
            x = parseInt(newX1) - parseInt(l.attr('y2') - l.attr('y1'));
            y = parseInt(newY1) - (-(l.attr('x2') - l.attr('x1')));
        }
        //отступ дуги
        length = 6;
        lenAB = Math.round(Math.sqrt(Math.pow(x - newX1, 2) + Math.pow(y - newY1, 2)));
        length = length - lenAB;
        var xz2 = Math.round(x + (x - newX1) / lenAB * length);
        var yz2 = Math.round(y + (y - newY1) / lenAB * length);

        var newX2 = begX;
        var newY2 = begY;
        if (position == 1) {
            x = parseInt(newX2) + parseInt(l.attr('y2') - l.attr('y1'));
            y = parseInt(newY2) + (-(l.attr('x2') - l.attr('x1')));
        } else if (position == 2) {
            x = parseInt(newX2) - parseInt(l.attr('y2') - l.attr('y1'));
            y = parseInt(newY2) - (-(l.attr('x2') - l.attr('x1')));
        }
        //Середина между дугой и линий, должно быть в два раза меньше "Отступа дуги"
        length = 3;
        lenAB = Math.round(Math.sqrt(Math.pow(x - newX2, 2) + Math.pow(y - newY2, 2)));
        length = length - lenAB;
        var cnt_xz = Math.round(x + (x - newX2) / lenAB * length);
        var cnt_yz = Math.round(y + (y - newY2) / lenAB * length);

        //Конечая дуга
        var pth = S.path('M' + newX + ',' + newY + 'Q' + cnt_xz + ',' + cnt_yz + ',' + xz + ',' + yz + 'L' + xz2 + ',' + yz2).attr({ stroke: "black", fill: "transparent", strokeWidth: 2 });
        pth.transform('s'+minK+','+minK+','+ S.node.clientWidth/2 + ',' + S.node.clientHeight/2 + '');
        return pth;
    }
}






//Класс РАЗВЕРТКА
function DrawRazvertka() {
    var S = Snap("#mysvg2");
    this.S = S;
    
    //Холст
    var Points = [0, 0, glob_width, 0, glob_width, glob_height, 0, glob_height];
    S.polygon().attr({
        points: Points,
        fill: "#f9f9f9",
        id: "canvas"
    });

    var x = 10;
    var y = 10;


    this.run = function () {
        console.log('Run razvertka');
    };


    this.remove = function () {
        $('#mysvg2').remove();
        $("#pnl3").append("<svg id=mysvg2></svg>");
    };

    this.drawRazvertka = function () {
        Razvertka.drawImage(ConstrDraw.gLines, ConstrDraw.gLineLengths, ConstrDraw.lengthSumm);
    }


    this.drawImage = function (lines, lengths, lengthSumm){       
        //Удаляем все
        S.clear();
        //Новый холст
        S.polygon().attr({
            points: Points,
            fill: "#f9f9f9",
            id: "canvas"
        });

        //Если закончили рисование то показываем развертку
        if (ConstrDraw.finished) {
            var c = S.rect(x, y, glob_width-120, Math.round(lengthSumm/2)).attr({fill:"none", stroke:"black", strokeWidth:1});
            var newY = y;
            var newL;
            var bbox;
            var dx,dy;
            var square_centerX,square_centerY ;
            var oldY = 0;
            var oldLen = 0;
            var summ =0;
            //Проходим по всем линиям и берем длину каждой следующей линии
            for (var i = 0; i < lengths.length; i++) {
                newL = Math.round(lengths[i]/2);
                newY = parseInt(newY + newL); 
                //Последнюю линию рсиовать не надо
                if (i != lengths.length-1){
                    var line = S.line(x,newY,glob_width-110,newY).attr({stroke:"black"});
                }
                //Находим x центр линии
                square_centerX = parseInt(line.attr('x1'))+parseInt(line.attr('x2'))/2
                square_centerY = oldY+(newY - oldY)/2;
                //Текст по центру 
                var txtCenter = S.text(square_centerX,newY,lengths[i].toString()).attr({fontSize:14, font:"Calibri"});
                //Текст справа
                var summ = parseInt(lengths[i]+oldLen); 
                var txtRight = S.text(glob_width-100,newY,summ.toString()).attr({fontSize:14, font:"Calibri"}); 
                bbox = txtCenter.getBBox();
                //Находим длину половины текста
                dx = Math.round(bbox.width / 2)+10;
                dy = Math.round(bbox.height / 2);
                txtCenter.attr({ 'x': square_centerX-dx, 'y': square_centerY+dy });
                oldY =  newY;
                oldLen = summ;
            } 
        }
    }

}










//Класс 3D
function Draw3D() {
    //Создаем 3D окно 
    var SCENE_WIDTH = glob_width;
    var SCENE_HEIGHT = glob_height;
    var scene = new THREE.Scene();
    var font;
    var modelWidth = 60; // ширина модели по XZ

    scene.background = new THREE.Color("#f9f9f9");
    var camera = new THREE.PerspectiveCamera(75, SCENE_WIDTH / SCENE_HEIGHT, 1, 1000);
    camera.position.set(15, 0, 40);

    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);

    var scene3d = document.getElementById("scene3D");
    scene3d.appendChild(renderer.domElement);

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(10, 0, 10);
    controls.update();

    loadFont();
    render();

    function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    this.run = function () {
        console.log('Run 3d');
    };

    this.remove = function () {
        $('#scene3D').remove();
        $("#pnl2").append("<div id=scene3D></div>");
    };

    this.drawModel = function () {
        Scene3D.drawScene3D(ConstrDraw.gLines, ConstrDraw.gLineLengths, ConstrDraw.gAngles);
    }

    function loadFont() {
        var loader = new THREE.FontLoader();
        loader.load('fonts/Calibri_Regular.json', function (res) {
            font = res;
        });
    }

    this.drawScene3D = function (lines, lengths, angles) {
        //Удаляем старую модель
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
        //Если закончили рисование то разрешаем показать 3D модель
        if (ConstrDraw.finished) {
            if (ConstrDraw.topPainted) {
                clrFront = "red";
                clrBack = "#cbcbcb";
            }
            if (ConstrDraw.botPainted) {
                clrBack = "red";
                clrFront = "#cbcbcb";
            }
            if (ConstrDraw.topPainted && ConstrDraw.botPainted) {
                clrFront = "red";
                clrBack = "red";
            } else if (!ConstrDraw.topPainted && !ConstrDraw.botPainted) {
                clrFront = "#cbcbcb";
                clrBack = "#cbcbcb";
            }
            //Координаты обводки модели
            var arr = [];
            //Сама модель
            var points = [];
            //Показываем линии 2D отрисовки внешние по Z
            for (var i = 0; i < lines.length; i++) {
                if (i == 0) {
                    points.push(new THREE.Vector3(parseInt(lines[i].attr('x1')), -lines[i].attr('y1'), 0));
                    points.push(new THREE.Vector3(parseInt(lines[i].attr('x1')), -lines[i].attr('y1'), modelWidth));
                    points.push(new THREE.Vector3(parseInt(lines[i].attr('x2')), -lines[i].attr('y2'), modelWidth));
                } else {
                    points.push(new THREE.Vector3(parseInt(lines[i].attr('x2')), -lines[i].attr('y2'), modelWidth));
                }
            }

            //Показываем линии 2D отрисовки внутренние по Z
            for (var i = lines.length - 1; i >= 0; i--) {
                points.push(new THREE.Vector3(parseInt(lines[i].attr('x2')), -lines[i].attr('y2'), 0));
            }

            //Заполняем массив с координатами обводки модели
            for (var i = 0; i < points.length; i++) {
                if (i == 0) {
                    //Добавляем начальную точку
                    arr.push(points[i].x);
                    arr.push(points[i].y);
                    arr.push(points[i].z);
                } else {
                    //Добавляем каждую точку по два раза
                    arr.push(points[i].x);
                    arr.push(points[i].y);
                    arr.push(points[i].z);

                    arr.push(points[i].x);
                    arr.push(points[i].y);
                    arr.push(points[i].z);
                }
            }
            //Добавляем начальную точку за замыкания полигона
            arr.push(points[0].x);
            arr.push(points[0].y);
            arr.push(points[0].z);



            //Создаем геометрию обводки модели по точкам   
            var lineGeometry = new THREE.LineSegmentsGeometry().setPositions(arr);
            var lineMaterial = new THREE.LineMaterial({ color: "black" });
            lineMaterial.resolution.set(SCENE_WIDTH, SCENE_HEIGHT);
            var linePavement = new THREE.LineSegments2(lineGeometry, lineMaterial);

            //Создаем геометрию модели по точкам
            var geom = new THREE.Geometry().setFromPoints(points);

            //Рассчитываем лицевые стороны по трем точкам, каждая точка это индекс вектора в массиве points
            var pts = []
            for (var i = 0; i < points.length; i++) {
                pts.push(i);
            }

            //Точки слева и справа модели
            var leftpts; //1,2,3
            var rightpts;//0,5,4

            //Расставляем в нужном порядке и разбиваем на два массива
            leftpts = pts.slice(1, (points.length / 2) + 1);
            rightpts = pts.slice((points.length / 2) + 1);
            rightpts.reverse();
            rightpts.unshift(pts[0]);

            //Заполняем лицевые стороны у нашей модели
            for (var i = 0; i < (points.length / 2) - 1; i++) {
                //Верхняя сторона
                geom.faces.push(new THREE.Face3(leftpts[i], leftpts[i + 1], rightpts[i + 1]));
                geom.faces.push(new THREE.Face3(leftpts[i], rightpts[i], rightpts[i + 1]));
                //Нижняя сторона
                geom.faces.push(new THREE.Face3(leftpts[i], leftpts[i + 1], rightpts[i + 1]));
                geom.faces.push(new THREE.Face3(leftpts[i], rightpts[i], rightpts[i + 1]));
            }

            var materialFront1 = new THREE.MeshBasicMaterial({ color: clrFront, side: THREE.FrontSide });
            var materialFront2 = new THREE.MeshBasicMaterial({ color: clrFront, side: THREE.BackSide });

            var materialBack1 = new THREE.MeshBasicMaterial({ color: clrBack, side: THREE.BackSide });
            var materialBack2 = new THREE.MeshBasicMaterial({ color: clrBack, side: THREE.FrontSide });

            //Устанавливаем индексы цветов для лиц
            var count = 1;
            for (var i = 0; i < geom.faces.length; i++) {
                if (count > 4) { count = 1 }
                if (count <= 4) {
                    geom.faces[i].materialIndex = count - 1;
                    count++
                }
            }

            //Находим коробку в которой находится модель
            geom.computeBoundingBox();
            // Вычисляем нормали
            geom.computeVertexNormals();

            var center = new THREE.Vector3();
            //Устанавливаем камеру по центру модели
            geom.boundingBox.getCenter(center);
            camera.position.set(center.x, center.y, center.z + 100);

            //Устанавливаем точку вращения модели (центральная точка модели)
            controls.target = center;
            controls.update();

            // Вычисляем нормали
            geom.computeVertexNormals();

            // Добавляем геометрию обводки модели на сцену
            scene.add(linePavement);

            var mesh = new THREE.Mesh(geom, [materialFront1, materialFront2, materialBack1, materialBack2]);
            // Добавляем геометрию и материал на сцену
            scene.add(mesh);


            //Формируем текст
            for (var i = 0; i < lines.length; i++) {
                var textGeo = new THREE.TextGeometry(lengths[i].toString(), {
                    font: font,
                    size: 3,
                    height: 1,
                    curveSegments: 20,
                    weight: "regular"
                });

                textGeo.computeBoundingBox();
                textGeo.computeVertexNormals();

                var cubeMat = new THREE.MeshLambertMaterial({ color: "black" });
                var text = new THREE.Mesh(textGeo, cubeMat);
                text.position.x = parseInt(lines[i].attr('x1'));
                text.position.y = -parseInt(lines[i].attr('y1'));
                text.position.z = 60

                scene.add(text);
            }


            //Показываем
            render();


        } else {
            //Показываем пустую сцену если finished = false
            scene = new THREE.Scene();
            scene.background = new THREE.Color("#f9f9f9");
            render();
        }
    }
}