
ymaps.ready(function () {
    var myPlacemark,
        myMap = new ymaps.Map('map', {
            center: [55.755381, 37.619044],
            zoom: 12,
            behaviors: ['default', 'scrollZoom'],
            controls: ['smallMapDefaultSet']
        }, {
            searchControlProvider: 'yandex#search'
        });

    
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('post', 'http://localhost:3000/', true)
        xhr.onload = function() {
            for (var address in xhr.response) {
                var reviews = xhr.response[address];

                reviews.forEach(function(review) {
                    placeMarkToMap([review.coords.x, review.coords.y], address, review.name, review.place, review.text)
                });
            }
        };
        xhr.send(JSON.stringify({op: 'all'}));

        // Создаем собственный макет с информацией о выбранном геообъекте.
        customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
            '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
            '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
            '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
        ),

        clusterer = new ymaps.Clusterer({
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
            // Устанавливаем стандартный макет балуна кластера "Карусель".
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            // Устанавливаем собственный макет.
            clusterBalloonItemContentLayout: customItemContentLayout,
            // Устанавливаем режим открытия балуна. 
            // В данном примере балун никогда не будет открываться в режиме панели.
            clusterBalloonPanelMaxMapArea: 0,
            // Устанавливаем размеры макета контента балуна (в пикселях).
            clusterBalloonContentLayoutWidth: 200,
            clusterBalloonContentLayoutHeight: 130,
            // Устанавливаем максимальное количество элементов в нижней панели на одной странице
            clusterBalloonPagerSize: 5
            // Настройка внешего вида нижней панели.
            // Режим marker рекомендуется использовать с небольшим количеством элементов.
            // clusterBalloonPagerType: 'marker',
            // Можно отключить зацикливание списка при навигации при помощи боковых стрелок.
            // clusterBalloonCycling: false,
            // Можно отключить отображение меню навигации.
            // clusterBalloonPagerVisible: false
        }),

            getPointData = function (index) {
            return {
                balloonContentBody: 'балунsafa <strong>метки ' + index + '</strong>',
                clusterCaption: 'меткаasdasd <strong>' + index + '</strong>'
            };
        },

            getPointOptions = function () {
            return {
                preset: 'islands#violetIcon'
            };
        },
        points = [
            [55.831903,37.411961], [55.763338,37.565466], [55.763338,37.565466], [55.744522,37.616378], [55.780898,37.642889], [55.793559,37.435983], [55.800584,37.675638], [55.716733,37.589988], [55.775724,37.560840], [55.822144,37.433781], [55.874170,37.669838], [55.716770,37.482338], [55.780850,37.750210], [55.810906,37.654142], [55.865386,37.713329], [55.847121,37.525797], [55.778655,37.710743], [55.623415,37.717934], [55.863193,37.737000], [55.866770,37.760113], [55.698261,37.730838], [55.633800,37.564769], [55.639996,37.539400], [55.690230,37.405853], [55.775970,37.512900], [55.775777,37.442180], [55.811814,37.440448], [55.751841,37.404853], [55.627303,37.728976], [55.816515,37.597163], [55.664352,37.689397], [55.679195,37.600961], [55.673873,37.658425], [55.681006,37.605126], [55.876327,37.431744], [55.843363,37.778445], [55.875445,37.549348], [55.662903,37.702087], [55.746099,37.434113], [55.838660,37.712326], [55.774838,37.415725], [55.871539,37.630223], [55.657037,37.571271], [55.691046,37.711026], [55.803972,37.659610], [55.616448,37.452759], [55.781329,37.442781], [55.844708,37.748870], [55.723123,37.406067], [55.858585,37.484980]
        ],
        geoObjects = [];

    /**
     * Данные передаются вторым параметром в конструктор метки, опции - третьим.
     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Placemark.xml#constructor-summary
     */
    for(var i = 0, len = points.length; i < len; i++) {
        geoObjects[i] = new ymaps.Placemark(points[i], getPointData(i), getPointOptions());
    }

    /**
     * Можно менять опции кластеризатора после создания.
     */
    clusterer.options.set({
        gridSize: 80,
        clusterDisableClickZoom: true
    });

    /**
     * В кластеризатор можно добавить javascript-массив меток (не геоколлекцию) или одну метку.
     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Clusterer.xml#add
     */
    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);

    /**
     * Спозиционируем карту так, чтобы на ней были видны все объекты.
     */

    myMap.setBounds(clusterer.getBounds(), {
        checkZoomRange: true
    });



// Слушаем клик на карте
    myMap.events.add('click', function (e) {
        var coords = e.get('coords');
        getAddress(coords).then(function(gotAddress) {
            console.log(gotAddress.properties.get('description').split(', ').pop() + ',' + ' ' + gotAddress.properties.get('name'))
            
            var address = gotAddress.properties.get('text')
                name = prompt ('Имя'),
                place = prompt ('Место'),
                text = prompt ('Комментарий')
                
            placeMarkToMap (coords, address, name, place, text)
            
            var xhr = new XMLHttpRequest();
            xhr.open('post', 'http://localhost:3000/', true)
            xhr.send(JSON.stringify({
            op: 'add',
            review: {
                coords: {
                    x: coords[0],
                    y: coords[1]
                },
                address: address,
                name: name,
                place: place,
                text: text,
                date: "2016.04.09 22:32:00"
            }
            }))
        })
        
    });

    // Создание метки
    function createPlacemark(coords) {
        return new ymaps.Placemark(coords, {
            preset: 'islands#violetStretchyIcon'
        });
    }

    // Определяем адрес по координатам (обратное геокодирование)
    function getAddress(coords) {
        return ymaps.geocode(coords).then(function (res) {
            return res.geoObjects.get(0);

        });
    }
        
    function placeMarkToMap (coords, address, name, place, text) {
        myPlacemark = createPlacemark(coords);
        myPlacemark.properties.set({
            balloonContentHeader: place,
            balloonContentBody: text,
            balloonContentFooter: name
        });
        clusterer.add(myPlacemark);
    }
});
