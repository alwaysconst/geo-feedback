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

    document.addEventListener('click', function (e){
        e.preventDefault();
        switch (e.target.id) {
            case 'feedback':
                clickOnMap(e.target.getAttribute("data-x") + ' ' + e.target.getAttribute("data-y"));
                break;
            case 'button-save':
                sendButton ();
                break;
            case 'close':
                closeButton ();
                break;
        }
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
            balloonContentFooter:'<strong>' + name + '</strong> ' + time(date)
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
        myMap.balloon.close();
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
    }

    function getAddress(clickCoords) {
        return ymaps.geocode(clickCoords, {results: 1}).then(function (res) {
            return res.geoObjects.get(0);
        });
    }

    function getReviewsOnAddress (addressOnClick) {
        var reviewsOnAddres = [];

        allReviews.forEach(function (item) {
            if (addressOnClick.indexOf(item.address) > -1) {
                if (!isNaN(item.date)) {
                    item.date = time(item.date);
                }
                reviewsOnAddres.push(item);
            }
        });

        reviewsOnAddres.reverse();

        rewiewsList.innerHTML = '';

        var source = rewiewsListTemplate.innerHTML,
            templateFn = Handlebars.compile(source),
            template = templateFn({list: reviewsOnAddres});
        if (!reviewsOnAddres[0]) {
            rewiewsList.innerHTML = 'Оставьте отзыв первым';
        } else {
            rewiewsList.insertAdjacentHTML("afterBegin", template);
            reviewsOnAddres = [];
        }
    }

    function closeButton () {
        document.querySelector('.review').classList.toggle('hide');
        clearInuts();
    }
    
    function sendButton () {
        var yourname = document.getElementById('yourname'),
            place = document.getElementById('place'),
            text = document.getElementById('text');

        (!yourname.value) ? yourname.classList.add('error') : yourname.classList.remove('error');
        (!place.value) ? place.classList.add('error') : place.classList.remove('error');
        (!text.value) ? text.classList.add('error') : text.classList.remove('error');

        if ( yourname.value && place.value && text.value) {
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
            clearInuts();
            getAllPlaceMarks();
        }
    }

    function time(date){
        date = new Date(date);
        return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
    }

    function clearInuts() {
        yourname.value = '';
        yourname.classList.remove('error');
        place.value = '';
        place.classList.remove('error');
        text.value = '';
        text.classList.remove('error');
    }
});