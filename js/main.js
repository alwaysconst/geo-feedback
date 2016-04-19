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
                    placeMarkToMap([review.coords.x, review.coords.y], address, review.name, review.place, review.text, review.date);
                });
            }
        };
        xhr.send(JSON.stringify({op: 'all'}));

            
    function placeMarkToMap (coords, address, name, place, text, date) {
        myPlacemark = createPlacemark(coords);
        myPlacemark.properties.set({
            balloonContentHeader: place,
            balloonContentBody: text,
            balloonContentFooter: name + ' ' + date,
        });
        clusterer.add(myPlacemark);
    }

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
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5
    }),

        getPointData = function (index) {
        return document.querySelector('.review').classList.remove('hide') && document.querySelector('.review').outerHTML
    },

        getPointOptions = function () {
        return {
            preset: 'islands#violetIcon'
        };
    },
    points = [],

    geoObjects = [];

    for(var i = 0, len = points.length; i < len; i++) {
        geoObjects[i] = new ymaps.Placemark(points[i], getPointData(i), getPointOptions());
    }

    clusterer.options.set({
        gridSize: 80,
        clusterDisableClickZoom: true
    });

    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);

// Слушаем клик на карте
    myMap.events.add('click', function (e) {
        var coords = e.get('coords');
            click = e.get('pagePixels')
            review = document.querySelector('.review')
            
            review.style.left = click[0] + 'px';
            review.style.top  = click[1] + 'px';
            review.classList.remove('hide');
        
        getAddress(coords).then(function(gotAddress) {
            
            var address = gotAddress.properties.get('description').split(', ').pop() + ',' + ' ' + gotAddress.properties.get('name')
            
            
                name = document.getElementById('name').value,
                place = document.getElementById('place').value,
                text = document.getElementById('text').value
            
            document.querySelector('.address').innerText = address;
            
                console.log(e.get('coords'));
            
            document.querySelector('#button-save').addEventListener('click', function (){
        
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
                    date: "Date"
                }
                }))
                
                placeMarkToMap (coords, address, name, place, text)

                document.querySelector('.review').classList.add('hide');
        })

            })
            document.querySelector('.close').addEventListener('click', function (e){
                document.querySelector('.review').classList.add('hide');

            });
          
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
});
