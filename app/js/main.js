ymaps.ready(function () {
    var myPlacemark,
        geoObjects = [],
        allReviews = [],
        addressOnClick = '',
        coords,
        method = 'post',
        host = 'http://smelukov.com:3000/';

        myMap = new ymaps.Map('map', {
            center: [55.755381, 37.619044],
            zoom: 12,
            behaviors: ['default', 'scrollZoom'],
            controls: ['smallMapDefaultSet']
        }, {
            searchControlProvider: 'yandex#search'
        });

    getAllPlaceMarks();

    function getAllPlaceMarks() {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open(method, host, true);
        xhr.onload = function() {
            clusterer.removeAll();
            allReviews = [];
            for (var address in xhr.response) {
                var reviews = xhr.response[address];
                reviews.forEach(function(review) {
                    putPlacemark([review.coords.x, review.coords.y], address, review.name, review.place, review.text, review.date);
                    allReviews.push(review);
                });
            }
            getReviewsOnAddress(addressOnClick);
        };
        xhr.send(JSON.stringify({op: 'all'}));
    }

    function putPlacemark (coords, address, name, place, text, date) {
        myPlacemark = createPlacemark(coords);
        myPlacemark.properties.set({
            balloonContentHeader: '<a href="" id="feedback" data-x="' + coords[0] + '" data-y="' + coords[1] + '">' + address + '</a>',
            balloonContentBody: place + '<br>' + text,
            balloonContentFooter:'<strong>' + name + '</strong>' + time(date)
        });
        clusterer.add(myPlacemark);
    }

    function createPlacemark(coords) {
        return new ymaps.Placemark(coords, {}, {
            preset: 'islands#redDotIcon',
            balloonContentLayout: customItemContentLayout
        });
    }

    customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="list_item">{{ geoObject.properties.balloonContentHeader|raw }}</div>' +
        '<h3 class=ballon_body>{{ properties.balloonContentBody|raw }}</h3>' +
        '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
    );

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
    });

    getPointData = function (index) {
        return document.querySelector('.review').classList.toggle('hide') && document.querySelector('.review').outerHTML
    };

    for(var i = 0, len = allReviews.length; i < len; i++) {
        geoObjects[i] = new ymaps.Placemark(allReviews[i], getPointData(i));
    }

    clusterer.options.set({
        gridSize: 80,
        clusterDisableClickZoom: true
    });

    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);

    myMap.events.add('click', function (e) {
        var clickCoords = e.get('coords');
        if (!myMap.balloon.isOpen()) {
            clickOnMap(clickCoords);
        } else {
            myMap.balloon.close();
            clickOnMap(clickCoords);
        }
    });

    
    function clickOnMap (clickCoords) {
        var review = document.querySelector('.review'),
            x = event.pageX + 380,
            y = event.pageY + 578;

        if (x > window.innerWidth) {
            review.style.left = ( x - (x - window.innerWidth) ) - 400 + 'px';
        } else {
            review.style.left = event.pageX + 'px'
        }
        if (y > window.innerHeight) {
            review.style.top = ( y - (y - window.innerHeight) ) - 570 + 'px';
        } else {
            review.style.top = event.pageY + 'px'
        }
        review.classList.remove('hide');

        getAddress(clickCoords).then(function(res) {
            addressOnClick = res.properties.get('description') + ',' + ' ' + res.properties.get('name');
            document.querySelector('.address').innerText = addressOnClick;
            coords = res.geometry.getCoordinates();

            getReviewsOnAddress (addressOnClick);
        });

        function getAddress(clickCoords) {
            return ymaps.geocode(clickCoords, {results: 1}).then(function (res) {
                return res.geoObjects.get(0);
            });
        }
    }
    
    function getReviewsOnAddress (addressOnClick) {
        var reviewsOnAddres = [];
        allReviews.forEach(function (review) {
            if (addressOnClick.indexOf(review.address) > -1) {
                console.log(review.date);
                review.date = time(review.date);
                reviewsOnAddres.push(review);
            }
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
    }
    
    document.addEventListener('click', function (e){
        e.preventDefault();
        if(e.target.id === 'feedback') {
            var click = e.target;
            clickOnMap(click.getAttribute("data-x") + ' ' + click.getAttribute("data-y"));
            myMap.balloon.close();
        }

        if (e.target.id === "button-save") {
            var yourname = document.getElementById('yourname'),
                place = document.getElementById('place'),
                text = document.getElementById('text');

            if ( yourname.value === '' ) {
                yourname.style.border = '1px solid #ff0000'
            } else {
                yourname.style.border = '1px solid #c4c4c4'
            }

            if ( place.value === '' ) {
                place.style.border = '1px solid #ff0000'
            } else {
                place.style.border = '1px solid #c4c4c4'
            }

            if ( text.value === '' ) {
                text.style.border = '1px solid #ff0000'
            } else {
                text.style.border = '1px solid #c4c4c4'
            }

            if ( yourname.value && place.value && text.value) {
                console.log(coords[0], coords[1], addressOnClick);
                var xhr = new XMLHttpRequest();
                xhr.open(method, host, true);
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
                        text: text.value
                    }
                }));
                getAllPlaceMarks();
                clearInuts();
            }
        }
    });

    document.querySelector('.close').addEventListener('click', function (){
        clearInuts();
        document.querySelector('.review').classList.toggle('hide');
    });

    function time(date){
        date = new Date(date);
        return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
    }

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