(function(root, factory) {
    if (!root.oneWorldWidget) {
        root.oneWorldWidget = factory();
        document.addEventListener('DOMContentLoaded', oneWorldWidget.initialize.bind(oneWorldWidget));
    }
}(this, function() {
    var isDataRequired = true,
        widgetListCode = [],
        tplListener = {},
        templateCollection = {},
        styleCollection = {},
        dataCollection = null,
        dataForSubmit = {},
        widgetParams = {
            width: 250, //can be use with 'flexible' param
            height: 400,
            dataUrl: './build/data/collection.json',
            tplUrl: './build/templates/widget-content.tpl',
            apis: {
                vote: 'https://1worldonline.com/1ws/api-v1/PollVote?apiKey=dc51ab19-7160-47c0-9ea8-fa529257251b'
            }
        };


    /*----------  init div/iframe  ----------*/
    function findAllWidgetContainers() {
        var selectOwoWidgetContainers = document.querySelectorAll('[data-owo-widget-type^=poll]');

        for (var i = 0; i < selectOwoWidgetContainers.length; i++) {
            selectOwoWidgetContainers[i].appendChild(addIframe());
        }
    }

    function addIframe() {
        var frame = document.createElement('iframe');

        frame.setAttribute('id', addIdToken());
        frame.setAttribute('scrolling', 'no');
        frame.setAttribute('frameborder', '0');
        frame.setAttribute('border', '0');
        frame.frameBorder = '0';
        frame.allowTransparency = 'true';
        frame.setAttribute('style',
                        'visibility: hidden; '+
                        'height: 0px!important; '
        );
        frame.setAttribute('src', 'javascript:0;');
        tplListener[frame.attributes.id.value] = 0;

        return frame;
    }

    function addIdToken(div) {
        var widgetContainer = div,
            token = Math.floor(Math.random() * 50000) + 10000;
        
        widgetListCode.push('owo-' + token);
        dataForSubmit['owo-' + token] = {};

        return 'owo-' + token;
    }

    /*----------  Ajax CORS wrapper  ----------*/
    function createCORSrequest(objParams) {
        var xhr = new XMLHttpRequest(),
            xdr;

        if ('withCredentials' in xhr) {
            //support for modern browser
            xhr.open(objParams.method, objParams.url, true);
        }
        else if (typeof XDomainRequest != undefined) {
            //IE support
            xdr = new XDomainRequest();
            xdr.open(objParams.method, objParams.url);
        }
        else {
            //xhr not supported
            xhr = null;
        }

        if (objParams.method === 'POST' && xhr) {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }

        return xhr != undefined ? xhr : xdr;
    }

    function makeCorsRequest(objParams) {
        var xhr = createCORSrequest(objParams);

        if (!xhr) {
            console.warn('CORS not supported!');
            return;
        }

        function param(object) {
            var encodedString = '';
            
            for (var prop in object) {
                if (object.hasOwnProperty(prop)) {
                    if (encodedString.length > 0) {
                        encodedString += '&';
                    }
                    encodedString += encodeURI(prop + '=' + object[prop]);
                }
            }
            return encodedString;
        }

        xhr.onload = function() {
            if (typeof objParams.callbackSuccess === 'function') {
                objParams.callbackSuccess(xhr.responseText);
            }
            else {
                console.log('Request without callback');
            }
        };

        xhr.onerror = function() {
            console.error('Request error');
        };

        if (objParams.method === 'GET') {
            xhr.send();
        }
        else if (objParams.method === 'POST') {
            xhr.send(param(objParams.data));
        }
    }

    /*----------  prepare tpl for action  ----------*/
    function prepareTpl(tpl) {
        var re = /<tpl[\s\t]+id=\"((?!\")\w+)\"[\s\t]*>(((?!<\/tpl).)*)<\/tpl>/g;

        tpl.replace(/(\r\n|\n|\r)/gm, "").replace(re, function(matchStr, id, template) {
            templateCollection[id] = template;
        });

        return templateCollection;
    }

    function prepareCss(tpl) {
        var re = /<css[\s\t]*>(((?!<\/tpl).)*)<\/css>/g;

        tpl.replace(/(\r\n|\n|\r)/gm, "").replace(re, function(matchStr, style) {
            styleCollection['css'] = style;
        });

        return styleCollection;
    }

    function renderTpl() {
        var frame;

        for (var i = 0; i < widgetListCode.length; i++) {
            frame = document.getElementById(widgetListCode[i]);
            injectContent(frame);
            injectCss(frame);
        }
    }

    function injectContent(frame, tplIndex) {
        var iframeDocument = frame.contentDocument,
            iframeBody = iframeDocument.getElementsByTagName('body')[0],
            tplCurrentIndex = tplIndex !== undefined ? tplIndex : 0,
            templateIDs = Object.keys(templateCollection),
            currentTpl = templateCollection[templateIDs[tplCurrentIndex]];
        

        if ( tplCurrentIndex === 0 && !iframeBody.children.length ) {
            iframeDocument.open();
            iframeDocument.write(currentTpl);
        }
        else {
            iframeBody.innerHTML = currentTpl;
        }

        //additional operations with template
        if (iframeDocument.getElementsByClassName('js-choosen-mark')[0] && iframeDocument.getElementsByClassName('js-choosen-model')[0]) {
            var mark = dataCollection.cars.mark[dataForSubmit[frame.attributes.id.value]['mark']],
                model = dataCollection.cars.model[dataForSubmit[frame.attributes.id.value]['mark']][dataForSubmit[frame.attributes.id.value]['model']];

            iframeDocument.getElementsByClassName('js-choosen-mark')[0].innerHTML = mark;
            iframeDocument.getElementsByClassName('js-choosen-model')[0].innerHTML = model;
        }

        //additional operations with iframe
        if (frame.style.visibility !== '' || frame.style.height === '0px') {
            setIframeInlineStyle(frame);
        }
    }

    function injectCss(frame) {
        var iframeDocument = frame.contentDocument,
            iframeHead = iframeDocument.getElementsByTagName('head')[0],
            styleTag = document.createElement('style'),
            style = styleCollection;

        styleTag.type = 'text/css';
        
        if (styleTag.styleSheet){
          styleTag.styleSheet.cssText = style.css;
        } 
        else {
          styleTag.appendChild(iframeDocument.createTextNode(style.css));
        }

        iframeHead.appendChild(styleTag);
    }

    function setIframeInlineStyle(frame) {
        var width,
            height = widgetParams.height;

        widgetParams.width === 'flexible' ? width = '100%' : width = widgetParams.width + 'px';
        frame.setAttribute('style', 'width:'+ width + '; height: ' + height + 'px');
    }

    /*----------  get data for widget  ----------*/
    function getWidgetData() {
        makeCorsRequest({
            url: widgetParams.dataUrl,
            method: 'GET',
            callbackSuccess: function(response) {
                try {
                    dataCollection = JSON.parse(response);
                    applyDataInForm();
                }
                catch (e) {
                    console.log('1W Error ' + e.name + ":" + e.message + "\n" + e.stack);
                }
            }
        });
    }

    /*----------  init listeners  ----------*/
    function initListeners(activeFrame) {
        var iframe = activeFrame !== undefined ? activeFrame : null;

        if (iframe === null) {
            for (var i = 0; i < widgetListCode.length; i++) {
                iframe = document.getElementById(widgetListCode[i]);
                setListeners(iframe);
            }
        }
        else {
            setListeners(iframe);
        }
    }

    function setListeners(iframe) {
        var btnNext = iframe.contentDocument.getElementById('js-next-step'),
            btnPrev = iframe.contentDocument.getElementById('js-prev-step');

        if ( btnNext !== null ) {
            btnNext.addEventListener('click', onStepNextClick, false);
        }

        if ( btnPrev !== null ) {
            btnPrev.addEventListener('click', onStepBackClick, false);
        }

        if (iframe.contentDocument.getElementById('mark') !== null) {// update this methods
            iframe.contentDocument.getElementById('mark').addEventListener('click', optionsListener, false);
        }

        function onStepNextClick(event) {
            event.preventDefault();
            
            if (validatePollForm(event)) {
                showNextStep();
            }
        }

        function onStepBackClick(event) {
            event.preventDefault();
            
            showPrevStep(); // add check for authorized status (if authorized - skip authorize step)
        }

        function optionsListener(event) {
            event.preventDefault();
            pickCarModel(event);
        }
    }

    /*----------  validate section  ----------*/
    function validatePollForm(event) {
        var isValid = true,
            form = event.currentTarget.parentElement,
            requireInputList = form.querySelectorAll('[require]');

        for (var i = 0; i < requireInputList.length; i++) {
            if ( !requireInputList[i].value ) {
                requireInputList[i].setAttribute('class', requireInputList[i].className + ' error');
                isValid = false;
            }
            else {
                requireInputList[i].setAttribute('class', requireInputList[i].className.replace('error', ''));
                prepareDataForSubmit(requireInputList[i]);
            }
        }

        return isValid;
    }

    function prepareDataForSubmit(input) {
        var activeIframeForm = document.activeElement,
            iframeId = activeIframeForm.attributes.id.value;

        dataForSubmit[iframeId][input.name] = input.value;
    }

    /*----------  tplCollection action  ----------*/
    function showNextStep() {
        var frame = document.activeElement,
            frameId = frame.attributes.id.value,
            templateLength = Object.keys(templateCollection).length;

        //check for last page (submit data from user)
        if ( tplListener[frameId] + 1  === templateLength  - 1 ) {
            pollVote(frameId);
            //pollAuth(frameId);
        }
        
        //check for next page
        if ( tplListener[frameId] < templateLength -1 ) {
            injectContent(frame, tplListener[frameId] + 1);
            initListeners(frame);
            tplListener[frameId] += 1;
        }
    }

    function showPrevStep() {
        var frame = document.activeElement,
            frameId = frame.attributes.id.value,
            templateLength = Object.keys(templateCollection).length;

        //check for first page
        // if ( tplListener[frameId] === 0 ) {
        //     console.log('first page riched');
        //     //pollAuth(frameId);
        // }

        if ( tplListener[frameId] !== 0 ) {
            showContent();
        }
        
        function showContent() {
            injectContent(frame, tplListener[frameId] - 1);
            initListeners(frame);
            tplListener[frameId] -= 1;

            // if ( !tplListener[frameId] ) {
            //     injectCss();
            // }
        }
    }

    /*----------  vote/auth action  ----------*/
    function pollVote(frameId) {
        var voteSide = dataForSubmit[frameId].model;
        
        makeCorsRequest({
            url: widgetParams.apis.vote,
            method: 'POST',
            data: {
                sideId: voteSide,
                urlVotedFrom: location.hostname
            },
            callbackSuccess: function(response) {
                try {
                    console.log('success vote ' + response);
                }
                catch (e) {
                    console.log('1W Error ' + e.name + ":" + e.message + "\n" + e.stack);
                }
            }
        });
    }

    /*----------  operation with Data  ----------*/
    function applyDataInForm() {
        var iframe,
            markOptionElement,
            markCollection = dataCollection.cars.mark;

        for (var i = 0; i < widgetListCode.length; i++) {
            iframe = document.getElementById(widgetListCode[i]).contentDocument;
            markOptionElement = iframe.getElementById('mark');

            for (var value in markCollection) {
                /*creating options for car mark*/
                var createOptionElement = iframe.createElement('option');
                createOptionElement.setAttribute('value', value);
                createOptionElement.text = markCollection[value];
                markOptionElement.appendChild(createOptionElement);
            }
        }
    }

    function pickCarModel(selectionEvent) {
        var selectedMark = selectionEvent.currentTarget.value,
            iframeForm = selectionEvent.currentTarget.parentNode,
            modelOptionElement = iframeForm.getElementsByClassName('js-pick-model')[0],
            modelCollection = dataCollection.cars.model,
            createOptionElement = document.createElement('option');

        //clear before adding new data
        modelOptionElement.innerHTML = '';
        
        if (modelCollection[selectedMark] !== undefined) {
            for (var value in modelCollection[selectedMark]) {
                /*creating options for car mark - > model*/
                var createOptionElement = document.createElement('option');
                createOptionElement.setAttribute('value', value);
                createOptionElement.text = modelCollection[selectedMark][value];
                modelOptionElement.appendChild(createOptionElement);

                if (modelOptionElement.hasAttribute('disabled')) {
                    modelOptionElement.removeAttribute('disabled');
                }
            }
        }
        else {
            var createOptionElement = document.createElement('option');
            createOptionElement.setAttribute('value', 'false');
            createOptionElement.text = dataCollection['defaultModel']['false'];
            modelOptionElement.setAttribute('disabled', 'disabled');
            modelOptionElement.appendChild(createOptionElement);
        }
    }

    return {
        version: '0.0.1',
        initialize: function() {
            var self = this;
            
            findAllWidgetContainers();
            self.render();
        },
        render: function() {
            var self = this;

            makeCorsRequest({
                url: widgetParams.tplUrl,
                method: 'GET',
                callbackSuccess: function(response) {
                    try {
                        prepareTpl(response);
                        prepareCss(response);
                        renderTpl();
                        if (isDataRequired) {
                            getWidgetData();
                        }
                        initListeners();
                    }
                    catch (e) {
                        console.log('1W Error ' + e.name + ":" + e.message + "\n" + e.stack);
                    }
                }
            });
        }
    };
}));