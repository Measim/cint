(function(root, factory) {
    if ( !root.owoWidget ) {
        root.owoWidget = factory();
        owoWidget.initialize.bind(owoWidget)();
    }
}(this, function() {
    var self = this,
        widgetDto = owPreparedData.widgetDto,
        widgetCode = widgetDto.widgetCode,
        frameId = owPreparedData.frameId,
        refererHref = owPreparedData.urlArguments.location,
        widgetType = owPreparedData.mode,
        subtype = owPreparedData.subtype,
        srcRoot = owPreparedData.srcRoot,
        displayLocale = widgetDto.displayLocale || widgetParams.defaultLanguage,
        languageMsgs = owPreparedData['Messages_' + displayLocale + '.json'],
        URL_SERVER = conf.URL_SERVER || 'http://1worldonline.com/1ws/json/',
        DOMAIN_URL = conf.DOMAIN_URL || 'http://1worldonline.com/',
        tplPage = 0,
        widgetParams = {
            width: '100%',
            height: '400px',
            defaultLanguage: 'en',
            tplUrl: srcRoot + '/templates/widget-content.tpl',
            pollRotationArrowsColor: '#4493d0'
        },
        owoAuthSettings = {
            apisUrl: {
                owoAuth: URL_SERVER + 'AccountFindCurrent',
                getLoginUrl: URL_SERVER + 'Member1GetLoginUrl'
            },
            FBAuthParam: {
                url: 'https://www.facebook.com/dialog/oauth',
                memberAuth: URL_SERVER + 'Member1FacebookOAuth2ByCode',
                oauthKeys: {
                    'code': 'accessCode'
                },
                member1LoginParamsDefault: {
                    redirectUrl: DOMAIN_URL,
                    signUpUrl: refererHref
                },
                queryParam: {
                    client_id: conf.FACEBOOK_ID,
                    response_type: 'code',
                    scope: 'email,user_posts',
                    redirect_uri: DOMAIN_URL
                }
            },
            TWAuthParam: {
                memberAuth: URL_SERVER + 'Member1LoginService',
                oauthKeys: {
                    'code': 'accessCode',
                    'token': 'token'
                },
                member1LoginParamsDefault: {
                    service: 'twitter',
                    rememberMe: true,
                    locale: 'en'
                }
            },
            GOAuthParam: {
                url: 'https://accounts.google.com/o/oauth2/v2/auth',
                memberAuth: URL_SERVER + 'Member1GoogleOAuth2ByCode',
                oauthKeys: {
                    'code': 'accessCode'
                },
                member1LoginParamsDefault: {
                    redirectUrl: DOMAIN_URL,
                    signUpUrl: refererHref
                },
                queryParam: {
                    client_id: conf.GOOGLE_CLIENT_ID,
                    response_type: 'code',
                    scope: 'email profile',
                    include_granted_scopes: true,
                    redirect_uri: DOMAIN_URL
                }
            },
            events: {
                '.js-fb-login': fbConnect,
                '.js-google-login': googleConnect,
                '.js-twitter-login': twitterConnect

            },
            popupParam: 'resizable=yes,height=500,width=400,toolbar=no,titlebar=no,me‌​nubar=no,scrollbars=yes'
        },
        templateCollection = {},
        templateIDs = null,
        templateLength = null,
        dataCollection = null,
        minAge = 13,
        maxAge = 100,
        selectors = {
            usrEmailLastStep: '.js-last-step-usr-email',
            usrAgeSelectClassName: 'js-age-select',
            btnNextClass: '.js-next-step',
            btnPrevClass: '.js-prev-step',
            btnSubmitClass: 'js-submit',
            emailErrClass: '.js-email-error',
            reCaptcha: '.js-re-captcha'
        },
        events = {
            '.js-next-step': onStepNextClick,
            '.js-prev-step': onStepBackClick
        },
        GA_ID = conf.GOOGLE_ANALYTICS_ID,
        owoUserId = null,
        isAuthorized = false,
        recaptchaIsValid = false,
        oauthEmailRecieved = false,
        doUpdateOwoAccount = false,
        dataForSubmit = {},
        oauthAccountData = {},
        owoApi = {
            createOWOAccount: URL_SERVER + 'Member1RegisterAggregatedPoller',
            updateEmail: URL_SERVER + 'AccountUpdateEmail',
            updateAccount: URL_SERVER + 'AccountUpdate',
            reCaptchaValidate: URL_SERVER + 'AccountVerifyGoogleRecaptcha',
            becomeCintMember : URL_SERVER + 'CintSendRequest'
        },
        reCaptchaOptions = {
            siteKey: '6Ldc-xoTAAAAANEoSU_JGVkGFIjd5dWE_M3NfEtV',
            reCaptchaLibSrc: 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaInit&render=explicit',
            className: 'g-recaptcha',
            settings: {
                sitekey: '6Ldc-xoTAAAAANEoSU_JGVkGFIjd5dWE_M3NfEtV',
                callback: checkReCaptchaResponse,
                'expired-callback': reloadReCaptcha
            }
        };

    function ajax(objParams) {
        function prepareParam(object) {
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

        function createCORSrequest(objParams) {
            var xhr = new XMLHttpRequest(),
                xdr;

            if ( 'withCredentials' in xhr ) {
                //support for modern browser
                xhr.withCredentials = true;
                if ( objParams && objParams.data && objParams.method === 'GET' ) {
                    objParams.url += '?' + prepareParam(objParams.data);
                }

                xhr.open(objParams.method, objParams.url, true);
                xhr.setRequestHeader('Access-Control-Allow-Credentials', true);
            }
            else if ( typeof XDomainRequest !== undefined ) {
                //IE support
                xdr = new XDomainRequest();
                xdr.open(objParams.method, objParams.url);
            }
            else {
                //xhr not supported
                xhr = null;
            }

            if ( objParams.method === 'POST' && xhr ) {
                if ( !objParams.contentType ) {
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded ;charset=UTF-8');
                }
                else if (objParams.contentType ) {
                    xhr.setRequestHeader("Content-type", objParams.contentType);
                }
            }

            return xhr !== undefined ? xhr : xdr;
        }

        return new Promise(function(resolve, reject) {
            var xhr = createCORSrequest(objParams);

            if ( xhr ) {
                xhr.onload = function() {
                    var parsedResponse;
                    if (xhr.status == 200) {
                        try {
                            parsedResponse = JSON.parse(xhr.response);
                        }
                        catch (e) {}
                        if ( isOwOResponse200Error(parsedResponse) ) {
                            reject(parsedResponse);
                        }
                        else {
                            resolve(xhr.response);
                        }
                    }
                    else {
                        reject(Error(xhr.statusText));
                    }
                };

                xhr.onerror = function() {
                    reject(Error('Network Error'));
                };

                if ( objParams.method === 'GET' ) {
                    xhr.send();
                }
                else if ( objParams.method === 'POST' && !objParams.contentType ) {
                    xhr.send(prepareParam(objParams.data));
                }
                else {
                    xhr.send(objParams.data);
                }
            }
            else {
                reject(Error('CORS not supported!'));
            }
        });
    }

    function prepareTpl(tpl) {
        var re = /<tpl[\s\t]+id=\"((?!\")\w+)\"[\s\t]*>(((?!<\/tpl).)*)<\/tpl>/g,
            mustagePattern = /\{\{\"([\w+\s\_.\-]+)\"\}\}/g,
            translatedTpl;

        tpl.replace(/(\r\n|\n|\r)/gm, "").replace(re, function(matchStr, id, template) {
            translatedTpl = template.replace(mustagePattern, function(str, key) {
                return getTranslatedMsg(key);
            });
            templateCollection[id] = translatedTpl;
        });
        templateIDs = Object.keys(templateCollection);
        templateLength = templateIDs.length;

        return templateCollection;
    }

    function getTranslatedMsg(key) {
        var messages = Object.keys(languageMsgs).length ? languageMsgs : owPreparedData['Messages.json'],
            translatedStr = "translation error";

        if ( key in messages ) {
            translatedStr = messages[key];
        }

        return translatedStr;
    }

    function renderTpl() {
        injectContent();
    }

    function injectContent(tplIndex) {
        var tplCurrentIndex = tplIndex !== undefined ? tplIndex : 0,
            divBody = document.getElementById('body'),
            currentTpl = templateCollection[templateIDs[tplCurrentIndex]],
            lastPageIndex = templateLength - 1;

        hideLoader();
        divBody.innerHTML = currentTpl;
        prepareAgeOptions(currentTpl);
        updateFormData();
        setOwoAuthListeners(divBody);

        if ( tplIndex === lastPageIndex) {
            insertUserEmail();
        }
    }

    function insertUserEmail() {
        var emailElem = document.querySelectorAll(selectors.usrEmailLastStep)[0];

        if ( emailElem ) {
            emailElem.innerHTML = dataForSubmit['user-info'].email;
        }
    }

    function updateFormData() {
        var forms = getCurrentForm(),
            formId,
            formElemList,
            formElemLenght,
            currentElem,
            index;

        if ( forms.length ) {
            formElemList = forms[0].elements;
            formElemLenght = formElemList.length - 1;
            formId = forms[0].attributes.id.value;
            index = formElemLenght;
            while ( index >= 0 ) {
                currentElem = formElemList[index];
                setElemOauthValue(currentElem, formId);
                index--;
            }

            if ( !isAuthorized ) {
                insertReCapchaContainer(selectors.reCaptcha);

                loadCaptcha();
            }
        }
    }

    function setElemOauthValue(elem, formId) {
        var elemName = elem.name,
            oauthKeys = Object.keys(oauthAccountData),
            keysLenght = oauthKeys.length,
            valueToSet = '';

        if ( keysLenght && oauthKeys.indexOf(elemName) !== -1 ) {
            if ( elemName !== 'dateOfBirth' ) {
                valueToSet = oauthAccountData[elemName];
            }
            else {
                valueToSet = new Date(oauthAccountData[elemName]).getFullYear();
            }
            if ( valueToSet ) {
                hideElem(elem);
            }
        }
        else if ( dataForSubmit[formId] && dataForSubmit[formId][elemName] ) {
            valueToSet = dataForSubmit[formId][elemName];
        }

        if ( valueToSet ) {
            elem.value = valueToSet;
        }
    }

    function hideElem(elem) {
        if ( hasClass(elem, 'hide') ) {
            elem.setAttribute('class', elem.className + ' hide');
        }
        else if ( elem && !elem.className ) {
            elem.setAttribute('class', 'hide');
        }
        else {
            elem.setAttribute('class', elem.className + ' hide');
        }
    }

    function hideMultipleByClassName(className) {
        var elems = document.querySelectorAll(className),
        elemCount = elems.length - 1;

        if ( className ) {
            while( elemCount >=0 ) {
                hideElem(elems[elemCount]);
                elemCount--;
            }
        }
    }

    function prepareAgeOptions(currentTpl) {
        var select,
            opt,
            today,
            maxDate,
            minDate,
            index;

        if ( typeof selectors.usrAgeSelectClassName === 'string' && currentTpl.indexOf(selectors.usrAgeSelectClassName) !== -1 ) {
            today = new Date();
            maxDate = today.getFullYear() - minAge;
            minDate = today.getFullYear() - maxAge;
            select = document.querySelectorAll('.' + selectors.usrAgeSelectClassName)[0];
            if ( select ) {
                index = maxDate;
                while ( index >= minDate ) {
                    opt = document.createElement('option');
                    opt.setAttribute('value', index);
                    opt.text = index;
                    select.appendChild(opt);
                    index--;
                }
            }
        }

        return select;
    }

    function setOwoAuthListeners(divBody) {
        var oauth = divBody.querySelectorAll('[data-owo-oauth^=true]');

        if ( oauth.length ) {
            initListeners(owoAuthSettings.events);
        }
    }

    function hideLoader() {
        var loader = document.getElementById('loaderDiv');

        if ( loader ) {
            if ( !hasClass(loader, 'hide') ) {
                loader.setAttribute('class', loader.className + ' hide');
            }
        }
    }

    function showLoader() {
        var loader = document.getElementById('loaderDiv');

        if ( loader ) {
            if ( hasClass(loader, 'hide') ) {
                loader.setAttribute('class', loader.className.replace('hide', ''));
            }
        }
    }

    function initListeners(events) {
        var divBody = document.getElementById('body');

        setListeners(divBody, events);
    }

    function setListeners(divBody, events) {
        var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent',
            messageEvent = eventMethod === 'attachEvent' ? 'onclick' : 'click',
            elem;

        for ( var className in events ) {
            elem = divBody.querySelectorAll(className)[0];
            if ( elem ) {
                elem[eventMethod](messageEvent, events[className], false);
            }
        }
    }

    function hasClass(elem, className) {
        return elem && elem.className && elem.className.indexOf(className) !== -1;
    }

    function insertReCapchaContainer(className) {
        var reCaptchaDIV,
            reCaptchas = document.querySelectorAll(className),
            reCptCout = reCaptchas.length - 1;

        while ( reCptCout >= 0 ) {
            reCaptchaDIV = document.createElement('div');
            reCaptchaDIV.setAttribute('class', reCaptchaOptions.className);
            reCaptchaDIV.setAttribute('data-sitekey', reCaptchaOptions.settings.siteKey);
            reCaptchas[reCptCout].appendChild(reCaptchaDIV);
            reCptCout--;
        }
    }

    function onStepNextClick(event) {
        var forms = getCurrentForm();

        event.preventDefault();

        if ( forms.length ) {
            if ( validatePollForm(forms[0]) ) {
                saveFormData(forms[0]);
                if ( hasClass(event.currentTarget , selectors.btnSubmitClass) ) {
                    hideMultipleByClassName('.js-form-error');
                    submitData().then(function(response) {
                        hideLoader();
                        showNextStep();
                    }, function(error) {
                        if ( isOwOResponse200Error(error) ) {
                            hideLoader();// add additional error parsers here (show messages to user etc)
                        }
                        else {
                            onError(error);
                        }
                    });
                }
                else {
                    showNextStep();
                }
            }
        }
        else {
            showNextStep();
        }
    }

    function onStepBackClick(event) {
        var forms = getCurrentForm();

        event.preventDefault();

        if ( forms.length ) {
            saveFormData(forms[0]);
        }

        showPrevStep();
    }

    function getCurrentForm() {
        return document.activeElement.getElementsByTagName('form');
    }

    function validatePollForm(form) {
        var isValid = true,
            requiredInputList = form.querySelectorAll('.js-form-input[required]');

        function validateEmptyForm() {
            for (var i = 0; i < requiredInputList.length; i++) {
                if ( !requiredInputList[i].value ) {
                    requiredInputList[i].setAttribute('class', requiredInputList[i].className + ' error');
                    isValid = false;
                }
                else {
                    requiredInputList[i].setAttribute('class', requiredInputList[i].className.replace('error', ''));
                }
            }
        }

        function validateCheckBoxes() {
            var requiredInputList = form.querySelectorAll('.js-form-checkbox[required]');

            for (var i = 0; i < requiredInputList.length; i++) {
                if ( !requiredInputList[i].checked ) {
                    requiredInputList[i].setAttribute('class', requiredInputList[i].className + ' error');
                    isValid = false;
                }
                else {
                    requiredInputList[i].setAttribute('class', requiredInputList[i].className.replace('error', ''));
                }
            }
        }

        function simpleEmailValidation() {
            var requiredInputList = form.querySelectorAll('.js-form-input[required][type=email]'),
                emailStr,
                emailValidationPatern = new RegExp('.+\@.+\..+');

            for (var i = 0; i < requiredInputList.length; i++) {
                if ( !requiredInputList[i].value ) {
                    requiredInputList[i].setAttribute('class', requiredInputList[i].className + ' error');
                    isValid = false;
                }
                else {
                    emailStr = requiredInputList[i].value;
                    if ( emailStr.search(emailValidationPatern) === -1 ) {
                        requiredInputList[i].setAttribute('class', requiredInputList[i].className + ' error');
                        isValid = false;
                    }
                    else {
                        requiredInputList[i].setAttribute('class', requiredInputList[i].className.replace('error', ''));
                    }
                }
            }
        }

        validateEmptyForm();
        validateCheckBoxes();
        simpleEmailValidation();
        isValid = validateCaptcha(isValid);

        return isValid;
    }

    function validateCaptcha(opt) {
        var cpt = document.querySelectorAll('.' + reCaptchaOptions.className),
            cptContainer = document.querySelectorAll(selectors.reCaptcha)[0],
            isValid = true;

        opt = ( typeof opt !== 'undefined' ) ? opt : true;

        if ( cpt.length && !recaptchaIsValid ) {
            isValid = false;
            cptContainer.setAttribute('class', cptContainer.className + ' error');
        }
        else {
            cptContainer.setAttribute('class', cptContainer.className.replace('error', ''));
        }

        return isValid && opt;
    }

    function saveFormData(form) {
        var formId = form.attributes.id.value,
            formElemList = form.elements,
            formElemLenght = formElemList.length - 1,
            currentElem;

        while ( formElemLenght >= 0 ) {
            currentElem = formElemList[formElemLenght];
            dataForSubmit[formId] = dataForSubmit[formId] ? dataForSubmit[formId] : {} ;
            dataForSubmit[formId][currentElem.name] = currentElem.value;
            formElemLenght--;
        }   
    }

    function showNextStep() {
        var body = document.getElementById('body');

        if ( tplPage < templateLength -1 ) {
            tplPage++;

            if ( isAuthPage(tplPage) && isAuthorized && tplPage + 1 <= templateLength -1 ) {
                tplPage++;
            }

            showContent();
        }
    }

    function showPrevStep() {
        var page;

        if ( tplPage !== 0 ) {
            page = tplPage - 1;
        }

        if ( isAuthPage(page) && isAuthorized && tplPage - 1 >= 0 ) {
            tplPage--;
        }

        if ( tplPage !== 0 ) {
            tplPage--;
            showContent();
        }
        else {
            showContent();
        }
    }

    function isAuthPage(page) {
        return templateCollection[templateIDs[page]].indexOf('data-owo-oauth="true"') !== -1;
    }

    function showContent() {
        injectContent(tplPage);
        initListeners(events);
    }

    function setDataFromAccount(account) {
        oauthAccountData.email = account.email || null;
        oauthAccountData.gender = account.gender || null;
        oauthAccountData.zipcode = account.zipcode || null;
        oauthAccountData.dateOfBirth = account.dateOfBirth || null;

        if ( account.email ) {
            oauthEmailRecieved = true;
        }
    }

    function doNeedToUpdateAccount() {
        var oauthKeys = Object.keys(oauthAccountData),
            keysIndex = oauthKeys.length - 1,
            oauthKey;

        while ( keysIndex >= 0 ) {
            oauthKey = oauthKeys[keysIndex];
            if ( !oauthAccountData[oauthKey] ) {
                doUpdateOwoAccount = true;
            }
            keysIndex--;
        }
    }

    function yearOfBirthToTimestamp(yearOfBirth) {
        var dateOfBirthTimeStamp = new Date();

        dateOfBirthTimeStamp.setFullYear(yearOfBirth);
        dateOfBirthTimeStamp.setMonth(0);
        dateOfBirthTimeStamp.setDate(2);
        dateOfBirthTimeStamp.getTime();

        return dateOfBirthTimeStamp * 1;
    }

    function submitData() {
        var response = new Promise(function(resolve, reject) {
            showLoader();
            if ( isAuthorized ) {
                updateOwoAccount().then(function() {
                    becomeCintMember().then(function(cint) {
                        resolve("Succcess");
                    }, function(error) {
                        reject(error);
                    });
                }, function(error) {
                    reject(error);
                });
            }
            else {
                createOWOAccount().then(function(id) {
                    if ( id ) {
                        becomeCintMember().then(function(cint) {
                            resolve("Succcess");
                        }, function(error) {
                            reject(error);
                        });
                    }
                    else {
                        reject("User Create error"); // probably no widget code 
                    }
                }, function(error) {
                    if ( isOwOResponse200Error(error) ) {
                        if (error.code === '00104') {
                            showErrorInDom(error.message, selectors.emailErrClass);
                        }
                    }
                    reject(error);
                });
            }
        });

        return response;
    }

    function loadCaptcha() {
        var script,
            language = displayLocale;
            reCaptchas = document.querySelectorAll('.' + reCaptchaOptions.className);

        if ( !window['___grecaptcha_cfg'] && reCaptchas.length ) {
            showLoader();
            script = document.createElement("script");
            script.type = "text/javascript";
            (document.getElementsByTagName( "head" )[ 0 ]).appendChild( script );
            script.setAttribute('async', "");
            script.setAttribute('defer', ""); 
            script.src = reCaptchaOptions.reCaptchaLibSrc + '&hl=' + language;
        }
        else if ( window['___grecaptcha_cfg'] && reCaptchas.length ) {
            renderReCaptcha();
        }
    }

    function updateOwoAccount() {
        var account = dataForSubmit['user-info'],
            response;

        account.dateOfBirth = yearOfBirthToTimestamp(account.dateOfBirth);
        account.id = owoUserId;

        response = new Promise(function(resolve, reject) {

            if ( !doUpdateOwoAccount && !oauthEmailRecieved ) {
                updateEmail().then(function() {
                    resolve();
                }, function(error) {
                    reject(error);
                });
            }
            else if ( doUpdateOwoAccount && !oauthEmailRecieved ) {
                updateEmail().then(function() {
                    ajax({
                        url: owoApi.updateAccount,
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            account: account
                        })
                    }).then(function() {
                        resolve();
                    }, function(error) {
                        reject(error);
                    });
                });
            }
            else if ( oauthEmailRecieved && doUpdateOwoAccount ) {
                ajax({
                    url: owoApi.updateAccount,
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        account: account
                    })
                }).then(function() {
                    resolve();
                }, function(error) {
                    reject(error);
                });
            }
            else {
                resolve();
            }

        });

        return response;
    }

    function updateEmail() {
        var account = {
            accountId: owoUserId,
            email: dataForSubmit['user-info'].email
        };

        return ajax({
            url: owoApi.updateEmail,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(account)
        });
    }

    function createOWOAccount() {
        var account = dataForSubmit['user-info'];

        account.dateOfBirth = yearOfBirthToTimestamp(account.dateOfBirth);
        account.username = account.email;
        account.widgetCode = widgetCode;

        return ajax({
            url: owoApi.createOWOAccount,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                account: account,
                sendEmail: true
            })
        });
    }

    function becomeCintMember() {
        return ajax({
            url: owoApi.becomeCintMember,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                url: refererHref,
                widgetCode: widgetCode
            })
        });
    }

    function onError(error) {
        hideLoader();
        try {
            if ( isOwOResponse200Error(error) ) {
                console.log('1W error code: ' + error.code + ': ' + error.message);
            }
            else {
                console.log('1W ' + error.name + ':' + error.message + '\n' + error.stack);
            }
        }
        catch (e) {}
    }

    function showErrorInDom(msg, className) {
        var elem = document.querySelectorAll(className);

        if ( elem.length ) {
            elem[0].innerHTML = msg;
            elem[0].setAttribute('class', elem[0].className.replace('hide', ''));
        }
    }

    function isOwOResponse200Error(error) {
        return error && error['@type'] && error['@type'] === 'com.oneworldonline.backend.apiresults.Error';
    }

    function renderReCaptcha() {
        var reCaptchas =  document.querySelectorAll('.' + reCaptchaOptions.className),
            reCptCout = reCaptchas.length - 1,
            reCptId;

        while ( reCptCout >= 0 ) {
            grecaptcha.render(reCaptchas[reCptCout], reCaptchaOptions.settings);

            reCptCout--;
        }
    }

    function validateReCaptcha(response) {
        if ( response ) {
            ajax({
                url: owoApi.reCaptchaValidate,
                method: 'GET',
                data: { response: response }
            }).then(function(status) {
                if ( JSON.parse(status).result === 'ok' ) {
                    recaptchaIsValid = true;
                    validateCaptcha();
                }
            });
        }
    }

    self.onRecaptchaInit = function() {
        hideLoader();
        renderReCaptcha();
    };

    function checkReCaptchaResponse(response) {
        validateReCaptcha(response);
    }

    function reloadReCaptcha() {
        recaptchaIsValid = false;
        grecaptcha.reset();
    }

    function onLoginSucces(account) {
        var usrAcc = account || {};

        isAuthorized = true;
        owoUserId = account.id;
        setDataFromAccount(usrAcc);
        doNeedToUpdateAccount();
        showNextStep();
        hideLoader();
    }

    function onLoginCancell() {
        hideLoader();
    }

    function initOWOAuth() {
        self.Oauth = (function() {
            var owoSettings = {},
                Oauth;

            Oauth = {
                setDefaultParams: function(options) {
                    var self = this;

                    owoSettings = options.owoAuthSettings;
                    Oauth.ajax = options.ajax;
                    Oauth.onError = options.onError;
                },
                getRemoteAuthLink: function() {
                    return Oauth.ajax({
                        url: owoSettings.apisUrl.getLoginUrl,
                        contentType: 'application/json',
                        method: 'POST',
                        data: JSON.stringify({
                            callbackUrl: DOMAIN_URL,
                            service: 'twitter'
                        })
                    });
                },
                getAuthLink: function(remoteUrl) {
                    function prepareUrlParam() {
                        var queryParam = Oauth.authParam.queryParam,
                            encodedString = '';

                        for ( var prop in queryParam ) {
                            if ( queryParam.hasOwnProperty(prop) ) {
                                if ( encodedString.length > 0 ) {
                                    encodedString += '&';
                                }
                                encodedString += encodeURI(prop + '=' + queryParam[prop]);
                            }
                        }
                        return encodedString;
                    }

                    return Oauth.authParam.url + '?' + prepareUrlParam();
                },
                redirectToAuthPage: function(pageUrl) {
                    if ( Oauth.popupWindow ) {
                        Oauth.popupWindow.location.href = pageUrl;
                    }
                    else {
                        console.log('\n%cPopup is blocked by browser', 'color: red;');
                    }
                },
                popupMonitor: function() {
                    var oauth = {
                        parseOAuthParameters: function() {
                            urlPartsLength = oauth.urlParts.length;
                            for ( var i = 0; i < urlPartsLength; i++ ) {
                                if ( oauth.urlParts[i].indexOf('code') != -1 ) {
                                   Oauth.accessCode = oauth.urlParts[i].split('=')[1];
                                   console.log('\n%coauth_verifier stored as code', 'color: green;', Oauth.accessCode);
                                }

                                if ( oauth.urlParts[i].indexOf('oauth_token' ) != -1) {
                                   Oauth.token = oauth.urlParts[i].split('=')[1];
                                   console.log('\n%coauth_token stored as token', 'color: green;', Oauth.token);
                                }

                                if ( oauth.urlParts[i].indexOf('oauth_verifier' ) != -1) {
                                   Oauth.accessCode = oauth.urlParts[i].split('=')[1];
                                   console.log('\n%coauth_token stored as token', 'color: green;', Oauth.accessCode);
                                }
                            }
                        },
                        getOAuthParameters: function() {
                            try {
                                oauth.url = Oauth.popupWindow.location.href;
                                if ( oauth.url.indexOf('code') != -1 || oauth.url.indexOf('oauth_verifier') != -1 ) {
                                    console.log('\n%cOAuth response redirect URL: ', 'color: green;', oauth.url);

                                    if ( oauth.url.indexOf('#_') !== -1 ) {
                                        oauth.urlParam = oauth.url.substring(oauth.url.indexOf('?') + 1, oauth.url.indexOf('#_'));
                                    }
                                    else {
                                        oauth.urlParam = oauth.url.substring(oauth.url.indexOf('?') + 1);
                                    }
                                    oauth.urlParts = oauth.urlParam.split('&');

                                    oauth.parseOAuthParameters();
                                    Oauth.triggerDefault(true); 
                                }
                            }
                            catch (e) {
                            }
                        },
                        init: function() {
                            oauth.getOAuthParameters();

                            if ( Oauth.popupWindow && Oauth.popupWindow.closed ) {
                                Oauth.triggerDefault(false);
                            }
                            else if ( !Oauth.popupInterval && Oauth.popupWindow ) {
                                Oauth.popupInterval = setInterval(Oauth.popupMonitor, 100);
                            }
                        }
                    };

                    oauth.init();
                },
                triggerDefault: function(submit) {
                    clearInterval(Oauth.popupInterval);
                    Oauth.popupInterval = null;
                    if ( submit ) {
                        Oauth.popupWindow.close();
                        Oauth.popupWindow = null;
                        console.log('\nOAuth authorized...');
                        Oauth.login();
                        clearInterval(Oauth.popupInterval);
                        Oauth.popupInterval = null;
                    }
                    else {
                        console.log('\nOAuth authorization closed');
                        if ( 'function' === typeof Oauth.callbackCancel ) {
                            Oauth.callbackCancel();
                        }

                        Oauth.popupWindow.close();
                    }
                },
                auth: function(opts) {
                    Oauth.popupWindow = window.open('about:blank', '', owoSettings.popupParam);
                    Oauth.authParam = owoSettings[opts.authParamName];

                    Oauth.callbackSucces = opts.callbackSucces;
                    Oauth.callbackCancel = opts.callbackCancel;

                    if ( !opts.remoteUrl ) {
                        Oauth.redirectToAuthPage(Oauth.getAuthLink());
                        Oauth.popupMonitor();
                    }
                    else {
                        Oauth.getRemoteAuthLink().then(function(callbackUrl) {
                            Oauth.redirectToAuthPage(callbackUrl.slice(1, callbackUrl.length - 1));
                            Oauth.popupMonitor();
                        }, function(error) {
                           Oauth.onError(error);
                        });
                    }
                },
                login: function() {
                    Oauth.memberLogin(Oauth.getMember1LoginParams()).then(function() {
                        if ( 'function' === typeof Oauth.callbackSucces ) {
                            Oauth.ajaxGetAccount(function(account) {
                                Oauth.callbackSucces(account);
                            });
                        }
                    }, function(error) {
                        Oauth.onError(error);
                    });
                },
                getMember1LoginParams: function() {
                    var member1LoginParamsDefault = Oauth.authParam.member1LoginParamsDefault,
                        oauthKeys = Oauth.authParam.oauthKeys,
                        storedAs;

                    for ( var key in oauthKeys ) {
                        storedAs = oauthKeys[key];

                        if ( Oauth[storedAs] ) {
                            member1LoginParamsDefault[key] = Oauth[storedAs];
                        }
                    }

                    return member1LoginParamsDefault;
                },
                memberLogin: function(member1LoginParamsDefault) {
                    return Oauth.ajax({
                        method: 'POST',
                        contentType: 'application/json',
                        url: Oauth.authParam.memberAuth,
                        data: JSON.stringify(member1LoginParamsDefault)
                    });
                },
                ajaxGetAccount: function (callback) {
                    var self = this,
                        account = {};

                    function isEmptyObj(obj) {
                        if(!obj) obj = {};
                        return Object.keys(obj).length ? false : true;
                    }

                    Oauth.ajax({
                        url: owoSettings.apisUrl.owoAuth,
                        method: 'POST'
                    }).then(function(response) {
                        if ( !isEmptyObj(response) ) {
                            if ( typeof callback == "function" ) {
                                account = JSON.parse(response);
                                callback(account);
                            }
                        }
                    }, function(error) {
                        Oauth.onError(error);
                    });
                }
            };

            return Oauth;
        })();

        self.Oauth.setDefaultParams({ owoAuthSettings: owoAuthSettings, ajax: ajax, onError: onError });

        return self.Oauth;
    }

    function fbConnect() {
        showLoader();

        self.Oauth.auth({
            authParamName: 'FBAuthParam',
            callbackSucces: onLoginSucces.bind(self),
            callbackCancel: onLoginCancell.bind(self)
        });
    }

    function googleConnect() {
        showLoader();

        self.Oauth.auth({
            authParamName: 'GOAuthParam',
            callbackSucces: onLoginSucces.bind(self),
            callbackCancel: onLoginCancell.bind(self)
        });
    }

    function twitterConnect() {
        showLoader();

        self.Oauth.auth({
            authParamName: 'TWAuthParam',
            remoteUrl: true,
            callbackSucces: onLoginSucces.bind(self),
            callbackCancel: onLoginCancell.bind(self)
        });
    }

    return {
        version: '0.0.1',
        onError: onError,
        showLoader: showLoader,
        ajax : ajax,
        validateReCaptcha: validateReCaptcha,
        initialize: function() {
            var self = this;

            self.render();
            self.initSocialLibs();
        },
        render: function() {
            var self = this;

            self.getWidgetTpl().then(function(tpl) {
                try {
                    self.preparePage(tpl);
                    renderTpl();
                    initListeners(events);
                    self.GAInit();
                }
                catch (e) {
                    console.log('1W Error ' + e.name + ": " + e.message + "\n" + e.stack);
                }
            });

            self.resizeFrame();
            self.createCSS();
        },
        initSocialLibs: function() {
            initOWOAuth();
        },
        resizeFrame: function() {
            var widget = {
                    height: widgetDto.height ? widgetDto.height + 'px': widgetParams.height ,
                    width: widgetDto.width ? widgetDto.width + 'px': widgetParams.width,
                    frameId: frameId

                },
                params = [];

            params.push(widget);
            window.parent.postMessage({
                data: {
                    method: 'resizeFrame',
                    arguments: params
                },
                type: 'action'

            }, '*');
        },
        createCSS: function() {
            var color = widgetDto.pollRotationArrowsColor || widgetParams.pollRotationArrowsColor,
                customCSS = '.js-custom-background { background: ' + color + ';}' + '.js-custom-color-text { color: ' + color + ';}',
                params = [],
                styleElement = document.createElement('style'),
                activeElement;

            styleElement.type = 'text/css';

            if ( styleElement.styleSheet ) {
                styleElement.styleSheet.cssText = customCSS;
            } 
            else {
                styleElement.appendChild(document.createTextNode(customCSS));
            }

            activeElement = document.activeElement;

            activeElement.appendChild(styleElement);
        },
        getWidgetTpl: function() {
            var self = this;

            return  self.ajax({
                url: widgetParams.tplUrl,
                method: 'GET'
            });
        },
        preparePage: function(response) {
            prepareTpl(response);
        },
        onLoginSucces: function(account) {
            var usrAcc = account || {};

            isAuthorized = true;
            owoUserId = account.id;
            setDataFromAccount(usrAcc);
            doNeedToUpdateAccount();
            showNextStep();
            hideLoader();
        },
        onLoginCancell: function() {
            hideLoader();
        },
        GAInit: function() {
            var self = this;

            if ( typeof ga === 'function' ) {
                self.GACreate();
                self.GAsetDimensions();
                self.GASend();
            }
        },
        GACreate: function() {
            ga('create', GA_ID, 'auto');
        },
        GAsetDimensions : function() {
            ga('set', 'dimension1', widgetCode);
            ga('set', 'dimension5', widgetType + '-' + subtype);
        },
        GASend: function() {
            ga('send', 'pageview', refererHref);
        }
    };
}));