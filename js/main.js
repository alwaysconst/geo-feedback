ymaps.ready(function () {
    var myPlacemark,
        allReviews = [],
        addressOnClick = '',
        coords
        myMap = new ymaps.Map('map', {
            center: [55.755381, 37.619044],
            zoom: 12,
            behaviors: ['default', 'scrollZoom'],
            controls: ['smallMapDefaultSet']
        }, {
            searchControlProvider: 'yandex#search'
        });
    
    showAllPlaceMarks()
    // Получаем все отзывы и расставляем их на карте
    function showAllPlaceMarks() {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('post', 'http://smelukov.com:3000/', true)
        xhr.onload = function() {
            clusterer.removeAll();
            allReviews = [];
            for (var address in xhr.response) {
                var reviews = xhr.response[address];
                reviews.forEach(function(review) {
                    placeMarkToMap([review.coords.x, review.coords.y], address, review.name, review.place, review.text, review.date);
                    allReviews.push(review);
                });
            };
            getReviewsOnAddress(addressOnClick);
        };
        xhr.send(JSON.stringify({op: 'all'}));
        
        
        function placeMarkToMap (coords, address, name, place, text, date) {
            date = new Date(date);
            myPlacemark = createPlacemark(coords);            
            myPlacemark.properties.set({
                balloonContentHeader: address,
                balloonContentBody: place + '<br>' + text,
                balloonContentFooter:'<strong>' + name + '</strong> ' + date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes(),
            });
            clusterer.add(myPlacemark);
        };

        // Создаём метки
        function createPlacemark(coords) {
            return new ymaps.Placemark(coords, {}, {
                preset: 'islands#redDotIcon',
                balloonContentLayout: customItemContentLayout
            });
        }
        return
    };
    
    // Создаем собственный макет с информацией о выбранном геообъекте.
    customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="list_item">{{ geoObject.properties.balloonContentHeader|raw }}</div>' +
        '<h3 class=ballon_body>{{ properties.balloonContentBody|raw }}</h3>' +
        '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
    ),

    clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedRedClusterIcons',
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

    points = [],

    geoObjects = [];

    for(var i = 0, len = points.length; i < len; i++) {
        geoObjects[i] = new ymaps.Placemark(points[i], getPointData(i));
    }

    clusterer.options.set({
        gridSize: 80,
        clusterDisableClickZoom: true
    });

    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);

    // Слушаем клик на карте
    myMap.events.add('click', function (e) {
        if (!myMap.balloon.isOpen()) {
            var clickCoords = e.get('coords')
            clickOnMap(clickCoords);
        }
        else {
            myMap.balloon.close();
        }
    });
    
    function clickOnMap (clickCoords) {
            review = document.querySelector('.review')
            //Определяем положение попапа
            review.style.left = '60px';
            review.style.top  = '60px';
            review.classList.remove('hide');
        
        //Получаем строку с адресом клика
        getAddress(clickCoords).then(function(gotAddress) {
            return addressOnClick = gotAddress.properties.get('description') + ',' + ' ' + gotAddress.properties.get('name');
        }).then(function (addressOnClick) {
            document.querySelector('.address').innerText = addressOnClick;
            //Определяем геообъект и его центр
            coords = ymaps.geocode(addressOnClick, {
                results: 1
            }).then(function (res) {
                var firstGeoObject = res.geoObjects.get(0);
                coords = firstGeoObject.geometry.getCoordinates();
            });
            getReviewsOnAddress (addressOnClick);
        });
        
        // Определяем адрес по координатам (обратное геокодирование)
        function getAddress(clickCoords) {
            return ymaps.geocode(clickCoords).then(function (res) {
                return res.geoObjects.get(0);
            });
        };
    };
    
    function getReviewsOnAddress (addressOnClick) {
        var reviewsOnAddres = [];
        // Проверяем, есть ли отзывы по данному адресу
        allReviews.forEach(function (reviews) {
            if (addressOnClick) {
                if (addressOnClick.indexOf(reviews.address) > -1) {
                    reviewsDate = new Date(reviews.date);
                    reviews.date = reviewsDate.getDate() + '.' + (reviewsDate.getMonth() + 1) + '.' + reviewsDate.getFullYear() + ' ' + reviewsDate.getHours() + ':' + reviewsDate.getMinutes();
                    reviewsOnAddres.push(reviews);
                    return false; 
                }   
            }
            return true;
        });

        // Вставляем данные в шаблон отзыва
        var rewiews = rewiewsListTemplate.innerHTML,
            templateFn = Handlebars.compile(rewiews),
            template = templateFn({list: reviewsOnAddres});
        if (!reviewsOnAddres[0]) {
            rewiewsList.innerHTML = 'Оставьте отзыв первым';
        } else {
            rewiewsList.innerHTML = template;
        }
    };
    
    document.getElementById('button-save').addEventListener('click', function (){
        yourname = document.getElementById('yourname'),
        place = document.getElementById('place'),
        text = document.getElementById('text')
        
        if ( yourname.value === '' ) {
            yourname.style.border = '1px solid #ff0000'
        } else {
            yourname.style.border = '1px solid #c4c4c4'
        };
        
        if ( place.value === '' ) {
            place.style.border = '1px solid #ff0000'
        } else {
            place.style.border = '1px solid #c4c4c4'
        };
        
        if ( text.value === '' ) {
            text.style.border = '1px solid #ff0000'
        } else {
            text.style.border = '1px solid #c4c4c4'
        };
        if ( yourname.value !== '' && place.value !== '' && text.value !== '') {
            var xhr = new XMLHttpRequest();
            xhr.open('post', 'http://smelukov.com:3000/', true)
            xhr.send(JSON.stringify({
            op: 'add',
            review: {
                coords: {
                    x: coords[0],
                    y: coords[1]
                },
                address: addressOnClick,
                name: yourname.value,
                place: place.value,
                text: text.value,
            }
            }))
            showAllPlaceMarks();
            clearInuts();
        };
    });

    document.querySelector('.close').addEventListener('click', function (){
        clearInuts();
        document.querySelector('.review').classList.add('hide');
    });
    
    // Очищаем форму при закрытии
    function clearInuts() {
        yourname.value = '';
        yourname.style.border = '1px solid #c4c4c4';
        place.value = '';
        place.style.border = '1px solid #c4c4c4';
        text.value = '';
        text.style.border = '1px solid #c4c4c4';
    }
    


});
