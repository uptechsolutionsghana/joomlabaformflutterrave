/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

var $f = jQuery,
    formsApp = {
        loaded: {}
    };

!function($){
    var formsModal = function(element){
        this.element = $(element).on('mousedown.formsModal', $.proxy(this.hide, this));
        this.position = element.dataset.position ? element.dataset.position : '';
        if (element.parentNode != document.body) {
            $('body').append(this.element);
        }
    }
    formsModal.prototype = {
        show: function(){
            this.element.css('display', '');
            this.setScroll();
            this.element.addClass('visible-forms-modal');
            let scroll = this.element[0].offsetWidth - this.element[0].clientWidth;
            this.element[0].style.setProperty('--forms-modal-scroll-width', scroll+'px');
        },
        setScroll: function(){
            document.body.classList.add('forms-modal-position-'+this.position);
            if (!document.body.classList.contains('forms-modal-opened')) {
                let scroll = window.innerWidth - document.documentElement.clientWidth;
                document.body.classList.add('forms-modal-opened');
                document.body.style.setProperty('--forms-body-scroll-width', scroll+'px');
            }
        },
        hide: function(event){
            if (!event || event.target.dataset.dismiss == 'formsModal' && event.button == 0) {
                let $this = this;
                this.element.removeClass('visible-forms-modal');
                setTimeout(function(){
                    $this.hideScroll();
                }, 300);
            }
        },
        hideScroll: function(){
            document.body.classList.remove('forms-modal-position-'+this.position);
            if (!document.querySelector('.visible-forms-modal')) {
                document.body.classList.remove('forms-modal-opened');
                document.body.style.removeProperty('--forms-body-scroll-width');
            }
        }
    }
    $.fn.formsModal = function(option){
        return this.each(function() {
            var data = $(this).data('formsModal');
            if (!data) {
                $(this).data('formsModal', (data = new formsModal(this)));
            }
            if (typeof option == 'string') {
                data[option]();
            } else {
                data.show();
            }
        });
    }
    $.fn.formsModal.Constructor = formsModal;
}(window.$f);

formsApp.renderFormsCalendar = function(input){
    if (input) {
        formsApp.calendar.formInput = input;
    }
    $f.ajax({
        type : "POST",
        dataType : 'text',
        url : "index.php?option=com_baforms&task=form.renderFormsCalendar",
        data: {
            start: formsApp.calendar.start,
            year: formsApp.calendar.year,
            month: formsApp.calendar.month * 1 + 1
        },
        complete:function(msg){
            var data = JSON.parse(msg.responseText),
                input = formsApp.calendar.formInput,
                div = document.createElement('div');
            div.innerHTML = data.body;
            for (let i = 0; i < formsApp.calendar.disable.days.length; i++) {
                $f(div).find('.ba-date-cell[data-day-number="'+formsApp.calendar.disable.days[i]+'"]').addClass('disabled-date');
            }
            for (let i = 0; i < formsApp.calendar.disable.dates.length; i++) {
                $f(div).find('.ba-date-cell[data-day-date="'+formsApp.calendar.disable.dates[i]+'"]').addClass('disabled-date');
            }
            for (let i = 0; i < formsApp.calendar.disable.range.length; i++) {
                let minMax = formsApp.calendar.disable.range[i].split(' - ');
                $f(div).find('.ba-date-cell').not('.disabled-date').each(function(){
                    if (this.dataset.dayDate >= minMax[0] && this.dataset.dayDate <= minMax[1]) {
                        this.classList.add('disabled-date');
                    }
                });
            }
            if (input.rangeBtn && input.dataset.index == 1) {
                let date = input.rangeBtn.dataset.value;
                $f(div).find('.ba-date-cell').not('.disabled-date').each(function(){
                    if (this.dataset.dayDate <= date) {
                        this.classList.add('disabled-date');
                    }
                });
            }
            formsApp.calendar.querySelector('.ba-forms-calendar-title').textContent = data.title;
            formsApp.calendar.querySelector('.ba-forms-calendar-header').innerHTML = data.header;
            formsApp.calendar.querySelector('.ba-forms-calendar-body').innerHTML = div.innerHTML;
            if (!formsApp.calendar.classList.contains('visible-forms-calendar')) {
                formsApp.calendar.classList.add('visible-forms-calendar');
            }
        }
    });
}

formsApp.setFormsCalendarEvents = function(){
    $f(formsApp.calendar).find('i[data-action]').on('click', function(){
        var year = formsApp.calendar.year * 1,
            month = formsApp.calendar.month * 1;
        if (this.dataset.action == 'next') {
            year = (month === 11) ? year + 1 : year;
            month = (month + 1) % 12;
        } else {
            year = (month === 0) ? year - 1 : year;
            month = (month === 0) ? 11 : month - 1;
        }
        formsApp.calendar.year = year;
        formsApp.calendar.month = month;
        formsApp.renderFormsCalendar();
    });
    $f(formsApp.calendar).on('click', '.ba-date-cell', function(){
        if (!(formsApp.calendar.classList.contains('disable-previous-date') && this.classList.contains('ba-previous-date'))
            && !this.classList.contains('disabled-date')) {
            formsApp.calendar.formInput.value = this.dataset.date;
            formsApp.calendar.formInput.dataset.value = this.dataset.dayDate;
            $f(formsApp.calendar.formInput).trigger('input');
            formsApp.calendar.classList.remove('visible-forms-calendar');
        }
    });
    $f(formsApp.calendar).find('.ba-close-calendar').on('click', function(){
        formsApp.calendar.classList.remove('visible-forms-calendar');
    });
}

formsApp.createCalendar = function($this){
    formsApp.calendar = document.createElement('div');
    formsApp.calendar.className = 'forms-calendar-wrapper';
    formsApp.calendar.innerHTML = '<div class="ba-forms-calendar"><div class="ba-forms-calendar-title-wrapper">'+
        '<i class="zmdi zmdi-chevron-left" data-action="prev"></i><span class="ba-forms-calendar-title"></span>'+
        '<i class="zmdi zmdi-chevron-right" data-action="next"></i></div><div class="ba-forms-calendar-header"></div>'+
        '<div class="ba-forms-calendar-body"></div></div><div class="ba-close-calendar"></div>';
    document.body.appendChild(formsApp.calendar);
    formsApp.calendar.year = $this.dataset.year;
    formsApp.calendar.month = $this.dataset.month;
    formsApp.setFormsCalendarEvents();
}

formsApp.hideNotice = function(){
    this.notification.classList.remove('notification-in');
    this.notification.classList.add('animation-out');
}

formsApp.showNotice = function(message, className){
    if (!this.notification) {
        this.notification = document.createElement('div');
        this.notification.id = 'ba-forms-notification';
        this.notification.innerHTML = '<i class="zmdi zmdi-close"></i><h4>'+this._('ERROR')+'</h4><p></p>';
        this.notification.querySelector('.zmdi-close').addEventListener('click', function(){
            formsApp.hideNotice();
        });
        document.body.appendChild(this.notification);
    }
    this.notification.showCallback = function(){};
    if (!className) {
        className = '';
    }
    if (this.notification.classList.contains('notification-in')) {
        this.notification.showCallback = function(){
            formsApp.notification.showCallback = function(){};
            formsApp.addNoticeText(message, className);
        };
    } else {
        this.addNoticeText(message, className);
    }
}

formsApp.addNoticeText = function(message, className){
    this.notification.querySelector('p').innerHTML = message;
    if (className) {
        this.notification.classList.add(className);
    } else {
        this.notification.classList.remove('ba-alert');
    }
    this.notification.classList.remove('animation-out')
    this.notification.classList.add('notification-in');
    clearTimeout(this.notification.hideDelay);
    this.notification.hideDelay = setTimeout(function(){
        formsApp.hideNotice();
        setTimeout(function(){
            if (className) {
                formsApp.notification.classList.remove(className);
            }
            formsApp.notification.showCallback();
        }, 400);
    }, 6000);
}

formsApp.getLocalStorage = function(){
    let storage = localStorage.getItem('forms-progress'),
        date = +new Date(),
        expire = false;
    if (!storage) {
        storage = '{}';
    }
    formsApp.storage = JSON.parse(storage);
    for (let ind in formsApp.storage) {
        let page = formsApp.storage[ind];
        for (let key in page) {
            let data = page[key];
            if (Math.floor((date - data.date) / (1000 * 60 * 60 * 24)) > 30) {
                expire = true;
                delete formsApp.storage[ind][key];
            }
        }
    }
    if (expire) {
        localStorage.setItem('forms-progress', JSON.stringify(formsApp.storage));
    }
}

formsApp.createForms = function(){
    formsApp.checkGoogleMaps();
    if (!formsApp.recaptcha && document.querySelector('.ba-form-submit-recaptcha-wrapper')) {
        formsApp.getRecaptchaData();
    }
    formsApp.getLocalStorage();
    $f('.com-baforms-wrapper').each(formsApp.createForm).closest('.ba-form-lightbox-layout').each(formsApp.renderLightbox);
}

formsApp.renderLightbox = function(){
    if (!this.trigger) {
        this.trigger = JSON.parse(this.dataset.trigger);
        this.session = JSON.parse(this.dataset.session);
        $f(this).removeAttr('data-trigger').removeAttr('data-session')
    }
    if (!this.session.enable) {
        formsApp.initLightbox(this);
    } else if (this.session.enable && this.trigger.type != '') {
        var flag = true;
        if (localStorage['formsModal-'+this.dataset.id]) {
            var date =  new Date().getTime(),
                expires = new Date(localStorage[this.dataset.id]);
            expires.getTime();
            if (date >= expires) {
                flag = true;
                localStorage.removeItem(this.dataset.id);
            } else {
                flag = false;
            }
        }
        if (flag) {
            formsApp.initLightbox(this);
        }
    }
}

formsApp.showLightbox = function($this){
    if ($this.session.enable) {
        var expiration = new Date();
        expiration.setDate(expiration.getDate()+$this.session.duration);
        localStorage.setItem('formsModal-'+$this.dataset.id, expiration);
    }
    $f($this).formsModal();
}

formsApp.initLightbox = function($this){
    if ($this.trigger.type == 'time-delay') {
        setTimeout(function(){
            formsApp.showLightbox($this);
        }, $this.trigger.time);
    } else if ($this.trigger.type == 'scrolling') {
        formsApp.lightboxScroll($this, $this.trigger.scroll * 1);
    } else if ($this.trigger.type == 'exit-intent') {
        $f(document).one('mouseleave', function(){
            formsApp.showLightbox($this);
        });
    } else if ($this.trigger.type == 'bottom-of-page') {
        formsApp.lightboxScroll($this, 100);
    }
}

formsApp.lightboxScroll = function($this, scroll){
    var top,
        docHeight,
        htmlHeight;
    $f(window).on('scroll.ba-lightbox'+$this.dataset.id+' load.ba-lightbox'+$this.dataset.id, function(){
        top = $f(window).scrollTop();
        docHeight = document.documentElement.clientHeight
        htmlHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        var x = (docHeight + top) * 100 / htmlHeight;
        if (x >= scroll || (scroll > 97 && x >= 97)) {
            $f(window).off('scroll.ba-lightbox'+$this.dataset.id+' load.ba-lightbox'+$this.dataset.id);
            formsApp.showLightbox($this)
        }
    });
}

formsApp.getRecaptchaResponse = function(elem){
    let response = '';
    try {
        response = grecaptcha.getResponse(formsApp.recaptcha.data[elem.id]);
    } catch (err) {
        console.info(err)
    }

    return response != '';
}

formsApp.checkAlert = function(form){
    form.find('.confirm-email-wrapper').find('input').each(function(){
        let alert = !this.value.trim(),
            key = 'THIS_FIELD_REQUIRED';
        if (this.value) {
            alert = !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*$/.test(this.value));
            key = 'ENTER_VALID_VALUE';
            if (!alert) {
                let email = this.closest('.ba-form-field-item').querySelector('.ba-input-wrapper input').value.trim();
                alert = !(email == this.value.trim());
                key = 'EMAIL_ADDRESSES_NOT_MATCH';
            }
        }
        formsApp.toggleAlertTooltip(alert, this, this.closest('.ba-field-container'), key);
    });
    form.find('.confirm-password-wrapper').find('input').each(function(){
        let password = this.closest('.ba-form-field-item').querySelector('.ba-input-wrapper input').value.trim(),
            alert = this.required && !this.value.trim(),
            key = 'THIS_FIELD_REQUIRED';
        if (password) {
            alert = !(password == this.value.trim());
            key = 'PASSWORDS_NOT_MATCH';
        }
        formsApp.toggleAlertTooltip(alert, this, this.closest('.ba-field-container'), key);
    });
    form.find('.ba-form-input-field, .ba-form-address-field').find(' > .ba-input-wrapper').find('input, textarea').each(function(){
        let alert = this.required && !this.value.trim(),
            key = 'THIS_FIELD_REQUIRED';
        if (this.formsInputMask) {
            alert = this.required && this.value == this.formsInputMask;
        }
        if (this.value && this.dataset.validation == 'email') {
            alert = !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*$/.test(this.value));
            key = 'ENTER_VALID_VALUE';
        } else if (this.value && this.dataset.validation == 'numbers') {
            alert = !(/^[0-9]+$/.test(this.value));
            key = 'ENTER_VALID_VALUE';
        } else if (this.value && this.dataset.validation == 'url') {
            alert = !(/\b(?:(?:https?|ftp):\/\/|www\.)[-a-z0-9+&@#\/%?=~_|!:,.;]*[-a-z0-9+&@#\/%=~_|]/i.test(this.value));
            key = 'ENTER_VALID_VALUE';
        } else if (!alert && this.value && this.formsInputMask) {
            alert = this.value != this.formsInputMask && this.value.indexOf('_') != -1;
            key = 'ENTER_VALID_VALUE';
        } else if (this.value && this.characters && this.characters.key == 'min') {
            alert = !(this.value.length > this.characters.length);
            key = 'ENTER_VALID_VALUE';
        }
        formsApp.toggleAlertTooltip(alert, this, this.closest('.ba-field-container'), key);
    });
    form.find('.ba-form-phone-field input.ba-phone-number-input').each(function(){
        let alert = this.required && this.value == this.formsInputMask,
            key = 'THIS_FIELD_REQUIRED';
        if (!alert && this.value) {
            alert = this.value != this.formsInputMask && this.value.indexOf('_') != -1;
            key = 'ENTER_VALID_VALUE';
        }
        formsApp.toggleAlertTooltip(alert, this, this.closest('.ba-field-container'), key);
    });
    form.find('.ba-form-upload-field').find('input[type="file"]').each(function(){
        let alert = this.required && this.uploads.count == 0;
        formsApp.toggleAlertTooltip(alert, this, this.closest('.upload-file-input'), 'THIS_FIELD_REQUIRED');
    });
    form.find('.ba-form-field-item').find('.ba-form-rating-group-wrapper').each(function(){
        if (this.dataset.required) {
            let alert = false;
            $f(this).find('input').each(function(){
                alert = !this.checked;
                if (this.checked) {
                    return false;
                }
            })
            formsApp.toggleAlertTooltip(alert, this, this.closest('.ba-form-rating-group-wrapper'), 'THIS_FIELD_REQUIRED');
        }
    });
    form.find('.ba-form-field-item').find('.ba-form-checkbox-group-wrapper').each(function(){
        if (this.dataset.required) {
            let alert = false;
            $f(this).find('input').each(function(){
                alert = !this.checked;
                if (this.checked) {
                    return false;
                }
            })
            formsApp.toggleAlertTooltip(alert, this, this.closest('.ba-form-checkbox-group-wrapper'), 'THIS_FIELD_REQUIRED');
        }
    });
    form.find('.ba-form-dropdown-field, .ba-form-select-multiple-field').find('select').each(function(){
        let alert = this.required && !this.value.trim();
        formsApp.toggleAlertTooltip(alert, this, this.closest('.ba-field-container'), 'THIS_FIELD_REQUIRED');
    });
    form.find('.ba-form-acceptance-field').find('.ba-field-container').each(function(){
        let alert = false;
        $f(this).find('input').each(function(){
            alert = !this.checked;
            if (this.checked) {
                return false;
            }
        })
        formsApp.toggleAlertTooltip(alert, this, this, 'THIS_FIELD_REQUIRED');
    });
    form.find('.ba-form-calendar-field input[required]').each(function(){
        formsApp.toggleAlertTooltip(!this.value.trim(), this, this.closest('.calendar-field-wrapper'), 'THIS_FIELD_REQUIRED');
    })
    let tooltip = form.find('.ba-form-field-item').find('.ba-alert-tooltip');
    if (tooltip.length) {
        tooltip[0].closest('.ba-form-field-item').scrollIntoView(true);
        return false;
    }
}

formsApp.toggleAlertTooltip = function(alert, $this, parent, key){
    if (alert && !$this.alertTooltip && !$this.closest('.hidden-condition-field')) {
        $this.alertTooltip = document.createElement('span');
        $this.alertTooltip.className = 'ba-alert-tooltip';
        $this.alertTooltip.textContent = formsApp._(key);
        let str = '.ba-input-wrapper, .confirm-email-wrapper, .confirm-password-wrapper, .forms-recaptcha,'+
            ' .calendar-field-wrapper, .ba-forms-authorize-field-wrapper';
        parent.closest(str).classList.add('ba-alert');
        parent.appendChild($this.alertTooltip);
    } else if (alert && $this.alertTooltip) {
        $this.alertTooltip.textContent = formsApp._(key);
    } else if (!alert && $this.alertTooltip) {
        formsApp.removeAlertTooltip($this);
    }
}

formsApp.removeAlertTooltip = function($this){
    if ($this.alertTooltip) {
        $this.alertTooltip.remove();
        $this.alertTooltip = null;
        $this.closest('.ba-alert').classList.remove('ba-alert');
    }
}

formsApp.setLanguage = function(){
    $f.ajax({
        type:"POST",
        dataType:'text',
        url: 'index.php?option=com_baforms&task=form.getFormsLanguage',
        complete: function(msg){
            formsApp.language = JSON.parse(msg.responseText);
        }
    });
}

formsApp._ = function(key){
    if (formsApp.language && formsApp.language[key]) {
        return formsApp.language[key];
    } else {
        return key;
    }
}

formsApp.checkGoogleMaps = function(){
    if (loadFormsMap.load && !formsApp.googleMaps && !loadFormsMap.loading) {
        loadFormsMap.loading = true;
        let script = document.createElement('script');
        script.src = JUri+'components/com_baforms/assets/js/mapStyles.js';
        script.onload = function(){
            formsApp.mapScript = document.createElement('script');
            formsApp.mapScript.onload = function(){
                formsApp.googleMaps = true;
                $f('.ba-form-map-field .ba-map-wrapper').each(function(){
                    formsApp.createGoogleMap(this, this.options);
                });
                $f('.ba-form-address-field input').each(function(){
                    this.createAutocomplete();
                });
            }
            formsApp.mapScript.src = 'https://maps.googleapis.com/maps/api/js?libraries=places&key='+loadFormsMap.api_key;
            document.head.append(formsApp.mapScript);
        }
        document.head.append(script);
    }
}

formsApp.createGoogleMap = function(div, obj){
    div.map = new google.maps.Map(div, obj.map);
    div.map.setOptions({styles: mapStyles[obj.styleType]});
    if (obj.marker.position) {
        let object = {
            position : obj.marker.position,
            map : div.map
        }
        if (obj.marker.icon) {
            object.icon = JUri+obj.marker.icon;
        }
        let marker = new google.maps.Marker(object);
        if (obj.marker.description) {
            marker.infoWindow = new google.maps.InfoWindow({
                content : obj.marker.description
            });
            if (obj.marker.infobox == 1) {
                marker.infoWindow.open(div.map, marker);
            }
            marker.addListener('click', function(event){
                this.infoWindow.open(div.map, this);
            });
        }
    }
}

formsApp.removeTmpAttachment = function(attachment, input, $this){
    if (attachment.dataset.id) {
        delete input.uploads[attachment.dataset.id];
        input.uploads.count--;
        formsApp.updateFieldsValues($this.fields, input, input.fieldId);
        formsApp.calculation($this);
        $f.ajax({
            type : "POST",
            dataType : 'text',
            url : "index.php?option=com_baforms&task=form.removeTmpAttachment",
            data: {
                id: attachment.dataset.id
            },
            complete:function(msg){
                attachment.remove();
            }
        });
    }
}

formsApp.getAttachmentHTML = function(input, type, name, $this){
    let attachment = document.createElement('div'),
        str = '';
    attachment.className = 'ba-form-xhr-attachment';
    if (type == 'file') {
        str += '<i class="zmdi zmdi-attachment-alt"></i>';
    } else {
        str += '<span class="attachment-intro-image"></span>';
    }
    str += '<span class="forms-attachment-title">'+name;
    str += '</span><span class="forms-attachment-progress-bar-wrapper"><span class="forms-attachment-progress-bar">';
    str += '</span></span><i class="zmdi zmdi-delete"></i>';
    attachment.innerHTML = str;
    $f(attachment).find('.zmdi-delete').on('click', function(){
        formsApp.removeTmpAttachment(attachment, input, $this);
    });

    return attachment;
}

formsApp.uploadAttachmentFile = function(files, input, $this){
    if (files.length && (input.options.count == '' || (input.options.count != '' && input.uploads.count < input.options.count))) {
        var file = files.shift(),
            type = input.options.images.indexOf(file.ext) == -1 ? 'file' : 'image',
            attachment = formsApp.getAttachmentHTML(input, type, file.name, $this),
            xhr = new XMLHttpRequest(),
            formData = new FormData();
        if (type == 'image') {
            let reader = new FileReader();
            reader.onloadend = function() {
                attachment.querySelector('.attachment-intro-image').style.backgroundImage = 'url('+reader.result+')';
            }
            reader.readAsDataURL(file);
        }        
        formData.append('file', file);
        formData.append('id', input.options.id);
        formData.append('field_id', input.dataset.id);
        xhr.upload.onprogress = function(event) {
            attachment.querySelector('.forms-attachment-progress-bar').style.width = Math.round(event.loaded / event.total * 100)+"%";
        }
        xhr.onload = xhr.onerror = function(){
            try {
                let obj = JSON.parse(this.responseText);
                input.uploads[obj.id] = obj;
                attachment.dataset.id = obj.id;
                input.uploads.count++;
            } catch (error) {
                console.info(error)
                console.info(this.responseText)
            }
            formsApp.uploadAttachmentFile(files, input, $this);
            setTimeout(function(){
                attachment.classList.add('forms-attachment-file-uploaded')
            }, 300);
        };
        input.options[type+'Container'].appendChild(attachment);
        xhr.open("POST", "index.php?option=com_baforms&task=form.uploadAttachmentFile", true);
        xhr.send(formData);
    } else {
        input.uploading = '';
        formsApp.updateFieldsValues($this.fields, input, input.fieldId);
        formsApp.calculation($this);
    }
}

formsApp.sendAjaxForm = function(form, $this){
    $this.form.find('.ba-form-total-field .ba-cart-total-row .field-price-value').each(function(){
        let object = {
            products: $f.extend(true, {}, this.calculation.products),
            total: this.calculation.total,
            resultTotal : this.calculation.resultTotal
        }
        for (let ind in object.products) {
            for (let i in object.products[ind]) {
                delete object.products[ind][i].input;
            }
        }
        if (this.calculation.shipping) {
            this.calculation.shipping.forEach(function(input){
                if (input.checked) {
                    object.shipping = {
                        price: input.price * 1,
                        title: input.dataset.title
                    }
                }
            });
        }
        if (this.calculation.promo) {
            object.promo = this.calculation.promo.code;
        }
        this.calculation.input.value = JSON.stringify(object);
    });
    let clone = form.cloneNode(true),
        payments = ['authorize', 'cloudpayments'],
        submitBtn = form.submitBtn;
    clone['submit-btn'].value = submitBtn.options.id;
    clone.task.value = 'form.message';
    $this.form.find('.upload-file-input .ba-forms-attachment').each(function(){
        let obj = $f.extend(true, {}, this.uploads),
            str = '',
            name = this.dataset.id;
        delete obj.count;
        str = JSON.stringify(obj);
        clone.querySelector('textarea[name="'+name+'"]').value = str;
    });
    $this.form.find('select[name]').each(function(){
        let cloneOptions = $f(clone).find('select[name="'+this.name+'"] option');
        this.querySelectorAll('option').forEach(function(element, ind){
            cloneOptions.get(ind).selected = element.selected;
        });
    });
    $f(clone).find('.hidden-condition-field').remove();
    if (!(submitBtn.options.onclick == 'payment' && payments.indexOf(submitBtn.options.payment) != -1)) {
        submitBtn.classList.add('ba-thank-you-animation-in');
    }
    if (submitBtn.options.onclick == 'payment' && submitBtn.options.payment == 'stripe') {
        formsApp.executeStripePayment(form, clone, $this);
    } else if (submitBtn.options.onclick == 'payment' && submitBtn.options.payment == 'authorize') {
        formsApp.executeAuthorizePayment(form, clone, $this);
    } else if (submitBtn.options.onclick == 'payment' && submitBtn.options.payment == 'cloudpayments') {
        formsApp.executeCloudPayments(form, clone, $this);
    } else if (submitBtn.options.onclick == 'payment') {
        clone.style.display = 'none';
        document.body.append(clone);
        clone.submit();
    } else {
        formsApp.XMLHttpRequestForm(form, clone, $this);
    }
}

formsApp.executeCloudPayments = function(form, clone, $this){
    if (!('cp' in window)) {
        let script = document.createElement('script');
        script.type = "text/javascript";
        script.onload = function(){
            formsApp.loadSCloudPaymentsData(form, clone, $this);
        }
        script.src = "https://widget.cloudpayments.ru/bundles/cloudpayments";
        document.head.append(script);
    } else {
        let object = {},
            title = [],
            code = 'RUB',
            widget = new cp.CloudPayments(),
            invoiceId = +(new Date());
        $this.form.find('.ba-form-total-field .ba-cart-total-row .field-price-value').last().each(function(){
            code = this.calculation.code;
            object = JSON.parse(this.calculation.input.value);
        });
        for (let ind in object.products) {
            for (let i in object.products[ind]) {
                title.push(object.products[ind][i].title)
            }
        }
        if (object.shipping) {
            title.push(object.shipping.title);
        }
        widget.charge({
            publicId: formsApp.cloudPayments.public_id,
            description: title.join(', '),
            amount: object.resultTotal,
            invoiceId: invoiceId,
            currency: code,
            skin: 'modern' //classic mini
        },
        function(options){
            let input = document.createElement('input');
            form.submitBtn.classList.add('ba-thank-you-animation-in');
            input.type = 'hidden';
            input.name = 'invoiceId';
            input.value = invoiceId;
            clone.append(input);
            formsApp.XMLHttpRequestForm(form, clone, $this);
        },
        function(reason, options){
            form.status = '';
        });
    }
}

formsApp.executeAuthorizePayment = function(form, clone, $this){
    if (!formsApp.authorize) {
        let div = document.createElement('div'),
            btn = null;
        div.innerHTML = '<div class="ba-forms-modal-backdrop"></div><div class="ba-forms-modal">'+
            '<div class="ba-forms-modal-header"><span class="ba-forms-modal-title">Authorize.Net</span>'+
            '<i class="zmdi zmdi-close" data-dismiss="formsModal"></i></div>'+
            '<div class="ba-forms-modal-body">'+
            '<div class="ba-forms-authorize-field-wrapper">'+
            '<input type="text" class="ba-forms-authorize-card-number"><i class="zmdi zmdi-card"></i></div>'+
            '<div class="ba-forms-authorize-field-wrapper">'+
            '<input type="text" class="ba-forms-authorize-expiration-date"><i class="zmdi zmdi-calendar-alt"></i></div>'+
            '<div class="ba-forms-authorize-field-wrapper">'+
            '<input type="text" class="ba-forms-authorize-card-code"><i class="zmdi zmdi-lock"></i></div>'+
            '</div><div class="ba-forms-modal-footer"><span class="ba-forms-authorize-pay-btn">'+
            '<span class="ba-forms-authorize-pay">'+formsApp._('PAY')+'</span>'+
            '<span class="field-price-currency"></span><span class="field-price-value"></span>'+
            '</span></div></div>';
        div.className = 'ba-forms-modal-wrapper ba-form-authorize-modal';
        div.dataset.dismiss = 'formsModal';
        btn = div.querySelector('.ba-forms-authorize-pay-btn');
        btn.cardNumber = div.querySelector('.ba-forms-authorize-card-number');
        btn.expirationDate = div.querySelector('.ba-forms-authorize-expiration-date');
        btn.cardCode = div.querySelector('.ba-forms-authorize-card-code');
        btn.cardNumber.placeholder = 'Card Number';
        btn.expirationDate.placeholder = 'MM / YY';
        btn.cardCode.placeholder = 'CVC';
        btn.cardNumber.addEventListener('input', function(){
            let value = this.value.replace(/\s/g, ''),
                match = value.match(/\d{1,16}/);
            if (!match) {
                this.value = '';
            } else {
                let str = '',
                    j = 1;
                for (let i = 0; i < match[0].length; i++) {
                    if (j == 5) {
                        j = 1;
                        str += ' ';
                    }
                    str += match[0][i];
                    j++;
                }
                if (str != this.value) {
                    this.value = str;
                }
            }
            this.filled = this.value.length >= 14 ? true : false;
        });
        btn.expirationDate.addEventListener('input', function(){
            formsApp.executeMask(this, '##/####');
            this.filled = this.value.match(/\d\d\/\d{4}/) ? true : false;
        });
        btn.cardCode.addEventListener('input', function(){
            let match = this.value.match(/\d{1,4}/);
            if (!match) {
                this.value = '';
            } else if (match[0] != this.value) {
                this.value = match[0];
            }
            this.filled = this.value.length >= 3 ? true : false;
        });
        btn.cardNumber.addEventListener('focus', function(){
            formsApp.removeAlertTooltip(this);
        });
        btn.expirationDate.addEventListener('focus', function(){
            formsApp.removeAlertTooltip(this);
        });
        btn.cardCode.addEventListener('focus', function(){
            formsApp.removeAlertTooltip(this);
        });
        formsApp.authorize = $f(div);
        document.body.append(div);
    }
    formsApp.authorize.attr('data-form', $this.formId);
    let price = symbol = '',
        position = false,
        total = 0;
    $this.form.find('.ba-form-total-field .ba-cart-total-row .field-price-value').last().each(function(){
        total = this.calculation.resultTotal;
        price = this.textContent;
        symbol = this.calculation.symbol;
        position = this.closest('.ba-field-container').classList.contains('right-currency-position');
    });
    formsApp.authorize.find('input').val('').each(function(){
        this.filled = false;
        formsApp.removeAlertTooltip(this);
    });
    formsApp.authorize.find('.ba-forms-authorize-pay-btn').each(function(){
        this.classList[position ? 'add' : 'remove']('right-currency-position');
        this.querySelector('.field-price-currency').textContent = symbol;
        this.querySelector('.field-price-value').textContent = price;
        this.total = total;
    }).off('click').on('click', function(){
        let btn = this;
        if (!btn.status && btn.cardNumber.filled && btn.expirationDate.filled && btn.cardCode.filled) {
            btn.status = 'pending';
            btn.classList.add('ba-thank-you-animation-in');
            $f.ajax({
                type: "POST",
                dataType: 'text',
                url: "?option=com_baforms&task=form.payAuthorize",
                data: {
                    id : $this.formId,
                    cardNumber: btn.cardNumber.value,
                    expirationDate: btn.expirationDate.value,
                    cardCode: btn.cardCode.value,
                    total : total
                },
                success: function(msg){
                    let obj = JSON.parse(msg),
                        input = document.createElement('input'),
                        flag = obj.transactionResponse && obj.transactionResponse.transId != '' && obj.transactionResponse.transId != 0;
                    setTimeout(function(){
                        btn.classList.remove('ba-thank-you-animation-in');
                        btn.classList.add('ba-thank-you-animation-out');
                        setTimeout(function(){
                            btn.classList.remove('ba-thank-you-animation-out');
                            if (!flag) {
                                formsApp.showNotice('Transaction failed', 'ba-alert');
                            }
                            setTimeout(function(){
                                btn.status = '';
                                if (flag) {
                                    input.type = 'hidden';
                                    input.name = 'transId';
                                    input.value = obj.transactionResponse.transId;
                                    clone.append(input);
                                    form.submitBtn.options.authorize_return_url = obj.return_url;
                                    form.submitBtn.classList.add('ba-thank-you-animation-in');
                                    formsApp.authorize.formsModal('hide');
                                    formsApp.XMLHttpRequestForm(form, clone, $this);
                                }
                            }, 600);
                        }, 300);
                    }, 2000);
                }
            });
        } else if (!btn.status) {
            ['cardNumber', 'expirationDate', 'cardCode'].forEach(function(el){
                if (!btn[el].filled) {
                    let key = 'THIS_FIELD_REQUIRED';
                    if (btn[el].value) {
                        key = 'ENTER_VALID_VALUE';
                    }
                    formsApp.toggleAlertTooltip(true, btn[el], btn[el].closest('.ba-forms-authorize-field-wrapper'), key);
                }
            });
        }
    });
    form.status = '';
    setTimeout(function(){
        formsApp.authorize.formsModal();
    }, 100);
}

formsApp.executeStripePayment = function(form, clone, $this){
    if (!('Stripe' in window)) {
        let script = document.createElement('script');
        script.type = "text/javascript";
        script.onload = function(){
            formsApp.loadStripeData(form, clone, $this);
        }
        script.src = "https://js.stripe.com/v3";
        document.head.append(script);
    } else {
        let object = '{}',
            name = 0;
        formsApp.stripe = Stripe(formsApp.stripeData.api_key);
        $this.form.find('.ba-form-total-field .ba-cart-total-row .field-price-value').last().each(function(){
            name = this.calculation.input.name;
            object = this.calculation.input.value;
        });
        $f.ajax({
            type: "POST",
            dataType: 'text',
            url: JUri+"?option=com_baforms&task=form.stripeCharges",
            data: {
                object : object,
                name: name,
                id : $this.formId
            },
            error: function(msg){
                console.info(msg.responseText)
            },
            success: function(msg){
                let obj = JSON.parse(msg),
                    input = document.createElement('input');
                formsApp.stripeData.sessionId = obj.id;
                input.type = 'hidden';
                input.name = 'payment_id';
                input.value = obj.payment_intent;
                clone.append(input);
                formsApp.XMLHttpRequestForm(form, clone, $this);
            }
        });
    }
}

formsApp.loadStripeData = function(form, clone, $this){
    $f.ajax({
        type:"POST",
        dataType:'text',
        url: 'index.php?option=com_baforms&task=form.getStripeData',
        complete: function(msg){
            formsApp.stripeData = JSON.parse(msg.responseText);
            formsApp.executeStripePayment(form, clone, $this)
        }
    });
}

formsApp.loadSCloudPaymentsData = function(form, clone, $this){
    $f.ajax({
        type:"POST",
        dataType:'text',
        url: 'index.php?option=com_baforms&task=form.getCloudPaymentsData',
        complete: function(msg){
            formsApp.cloudPayments = JSON.parse(msg.responseText);
            formsApp.executeCloudPayments(form, clone, $this)
        }
    });
}

formsApp.XMLHttpRequestForm = function(form, clone, $this){
    let btn = form.submitBtn,
        xhr = new XMLHttpRequest(),
        data = new FormData(clone);
    xhr.onload = xhr.onerror = function(){
        if (xhr.readyState == 4) {
            setTimeout(function(){
                btn.classList.remove('ba-thank-you-animation-in');
                btn.classList.add('ba-thank-you-animation-out');
                setTimeout(function(){
                    btn.classList.remove('ba-thank-you-animation-out');
                    setTimeout(function(){
                        formsApp.clearFields($this);
                        if (xhr.status != 200) {
                            console.info(xhr.responseText);
                        }
                        form.status = '';
                        $this.form.find('.ba-form-page').hide().first().css('display', '');
                        $f(btn).trigger('success-submit');
                        if (btn.options.onclick == 'message') {
                            formsApp.showNotice(btn.options.message);
                        } else if (btn.options.onclick == 'redirect') {
                            window.location.href = xhr.responseText;
                        } else if (btn.options.payment == 'stripe') {
                            formsApp.stripe.redirectToCheckout({
                                sessionId: formsApp.stripeData.sessionId
                            }).then(function(result) {
                                console.info(result)
                            });
                        } else if (btn.options.payment == 'authorize' && btn.options.authorize_return_url) {
                            window.location.href = btn.options.authorize_return_url;
                        } else if (btn.options.payment == 'cloudpayments') {
                            window.location.href = formsApp.cloudPayments.return_url;
                        }
                    }, 500);
                }, 300);
            }, 1500);
        }
    };
    xhr.open("POST", clone.action, true);
    xhr.send(data);
}

formsApp.clearFields = function($this){
    if (formsApp.storage[$this.formURL] && formsApp.storage[$this.formURL][$this.formId]) {
        delete formsApp.storage[$this.formURL][$this.formId];
        localStorage.setItem('forms-progress', JSON.stringify(formsApp.storage));
    }
    let not = '[data-type="submit"], [data-type="map"], [data-type="html"], [data-type="text"], [data-type="image"], [data-type="headline"]';
    $this.form.find('.ba-form-field-item').not(not).each(function(){
        let input = $f(this).find('[name]');
        switch (this.dataset.type) {
            case 'input' :
            case 'address':
            case 'calendar':
                input.val('').trigger('input');
                if (this.querySelector('.confirm-email-wrapper')) {
                    this.querySelector('.confirm-email-wrapper input').value = '';
                }
                if (this.querySelector('.confirm-password-wrapper')) {
                    this.querySelector('.confirm-password-wrapper input').value = '';
                    this.querySelector('.confirm-password-wrapper input').type = 'password';
                }
                if (this.querySelector('.ba-input-password-icons')) {
                    input[0].type = 'password';
                }
                break;
            case 'phone':
                let parent = input.closest('.ba-field-container'),
                    flag = parent.find('.ba-phone-selected-country').attr('data-default');
                parent.find('li.ba-phone-country-item[data-flag="'+flag+'"]').trigger('click');
                break;
            case 'radio':
            case 'checkbox':
            case 'rating':
                input.prop('checked', false).trigger('change');
                break;
            case 'select':
            case 'selectMultiple':
                input.find('option').prop('selected', false);
                input.trigger('change');
                break;
            case 'acceptance':
                input[0].checked = false;
                break;
            case 'slider':
                input.val('');
                $f(this).find('input[type="range"]').each(function(){
                    if ('index' in this.dataset) {
                        this.value = this.dataset.index == 0 ? this.min : this.max;
                    } else {
                        this.value = this.min;
                    }
                }).trigger('input');
                break;
            case 'upload':
                input.val('');
                this.querySelector('.ba-forms-attachment').uploads = {
                    count: 0
                }
                $f(this).find('.ba-forms-xhr-attachment-wrapper').empty();
                break;
        }
    });
}

formsApp.getProgressData = function($this){
    let not = '[data-type="submit"], [data-type="map"], [data-type="html"], [data-type="text"], [data-type="image"], [data-type="headline"]',
        progress = {
            id: $this.formId,
            date: +new Date(),
            url: $this.formURL,
            fields: []
        };
    $this.form.find('.ba-form-field-item').not(not).each(function(){
        let input = this.querySelector('[name]'),
            obj = {
                name: input.name,
                type: this.dataset.type,
                data: {}
            }
        switch (this.dataset.type) {
            case 'input' :
            case 'address':
            case 'calendar':
                obj.data.value = input.value;
                if (input.formsInputMask) {
                    obj.data.value = '';
                    for (let i = 0; i < input.value.length; i++) {
                        if (input.formsInputMask[i] == '_') {
                            obj.data.value += input.value[i];
                        }
                    }
                }
                if (this.querySelector('.confirm-email-wrapper')) {
                    obj.data.confirm = this.querySelector('.confirm-email-wrapper input').value;
                }
                if (this.querySelector('.confirm-password-wrapper')) {
                    obj.data.password = this.querySelector('.confirm-password-wrapper input').value;
                }
                break;
            case 'phone':
                let parent = input.closest('.ba-field-container'),
                    match = parent.querySelector('.ba-phone-selected-country .ba-phone-flag').className.match(/ba-phone-flag-\w+/),
                    phoneNumber = parent.querySelector('.ba-phone-number-input');
                obj.data.value = '';
                obj.data.flag = match[0].replace('ba-phone-flag-', '');
                for (let i = 0; i < phoneNumber.value.length; i++) {
                    if (phoneNumber.placeholder[i] == '_') {
                        obj.data.value += phoneNumber.value[i];
                    }
                }
                break;
            case 'radio':
            case 'checkbox':
            case 'rating':
                obj.data.checked = new Array();
                input = this.querySelectorAll('[name]')
                for (let i = 0; i < input.length; i++) {
                    if (input[i].checked) {
                        obj.data.checked.push(input[i].value)
                    }
                }
                break;
            case 'select':
            case 'selectMultiple':
                obj.data.selected = new Array();
                input = this.querySelectorAll('select[name] option')
                for (let i = 0; i < input.length; i++) {
                    if (input[i].selected) {
                        obj.data.selected.push(input[i].value);
                    }
                }
                break;
            case 'acceptance':
                obj.data.selected = input.checked;
                break;
            case 'slider':
                obj.data.type = this.querySelector('.form-range-wrapper') ? 'range' : 'slider';
                obj.data.value = input.value;
                break;
            case 'upload':
                obj.data.uploads = this.querySelector('.ba-forms-attachment').uploads;
                break;
        }
        progress.fields.push(obj);
    });

    return progress;
}

formsApp.checkAutoNavigation = function($this, field){
    if ($this.autoNavigation.enable) {
        let page = field.closest('.ba-form-page'),
            next = true;
        page.querySelectorAll('.ba-form-field-item').forEach(function(el){
            let empty = true;
            if ($this.autoNavigation.fields.indexOf(el.dataset.type) == -1) {

            } else if (el.dataset.type == 'select') {
                empty = el.querySelector('select').value == '';
            } else {
                el.querySelectorAll('input').forEach(function(input){
                    if (input.checked) {
                        empty = false;
                        return false;
                    }
                });
            }
            if (empty) {
                next = false;
                return false;
            }
        });
        if (next) {
            $f(page).find('.ba-form-page-break-button[data-action="next"]').trigger('click');
        }
    }
}

formsApp.createForm = function(){
    if (this.formId) {
        return true;
    }
    let $this = this,
        defaultValues = {};
    $this.carts = [];
    $this.products = {};
    $this.fields = {};
    $this.calculation = {};
    $this.items = {};
    $this.autoNavigation = {
        enable : false,
        fields: ['select', 'radio', 'rating']
    };
    this.formId = this.querySelector('input[name="form-id"]').value * 1;
    formsApp.loaded[this.formId] = this;
    this.querySelector('input[name="page-title"]').value = document.querySelector('title').textContent;
    this.querySelector('input[name="page-url"]').value = window.location.href;
    this.querySelectorAll('input[name="page-id"]').forEach(function(el){
        if (el.value == 0 && window.themeData) {
            el.value = window.themeData.id;
        }
    });
    this.formURL = window.location.host.replace('www.', '')+window.location.pathname.replace('/index.php', '');
    if (this.formURL[this.formURL.length - 1] != '/') {
        this.formURL += '/';
    }
    this.form = $f(this).find('form').on('submit', function(event){
        event.preventDefault();
    });
    this.form.find('.ba-form-submit-btn').each(function(){
        this.options = {
            id: this.dataset.id,
            onclick: this.dataset.onclick,
            message: this.dataset.message,
            payment: this.dataset.payment,
            link: this.dataset.link,
            productTitle: this.dataset.productTitle,
            productPrice: this.dataset.productPrice
        }
    }).removeAttr('data-payment').removeAttr('data-id').removeAttr('data-link').on('click', function(){
        let form = $this.form[0];
        if (form.status != 'pending') {
            form.submitBtn = this;
            formsApp.checkAlert($this.form);
            $f(this).closest('.ba-form-submit-wrapper').find('.forms-recaptcha').each(function(){
                let alert = !formsApp.getRecaptchaResponse(this);
                formsApp.toggleAlertTooltip(alert, this, this, 'THIS_FIELD_REQUIRED');
            });
            if ($this.form.find('.ba-form-field-item').not('.hidden-condition-field').find('.ba-alert-tooltip').length == 0) {
                form.status = 'pending';
                formsApp.sendAjaxForm(form, $this);
            }
        }
    }).removeAttr('data-onclick').removeAttr('data-message');
    this.form.find('.ba-form-page-break-button').each(function(){
        if (this.dataset.action == 'next' && this.dataset.auto) {
            $this.autoNavigation.enable = true;
        }
    }).on('click', function(){
        let page = $f(this).closest('.ba-form-page'),
            rect = $this.form[0].getBoundingClientRect(),
            pageKey = page[0].dataset.pageKey;
        if (this.dataset.action == 'next') {
            formsApp.checkAlert(page);
            if (page.find('.ba-form-field-item').not('.hidden-condition-field').find('.ba-alert-tooltip').length) {
                return false;
            }
        }
        page.hide();
        if ($this.pages && $this.pages[pageKey] && this.dataset.action == 'next') {
            page = $f($this.pages[pageKey].next).css('display', '');
            page.find('.ba-form-page-break-button[data-action="back"]')[0].prevPage = pageKey;
        } else if (this.dataset.action == 'back' && this.prevPage) {
            page = $f($this.pages[this.prevPage].prev).css('display', '');
            this.prevPage = null;
        } else {
            page = page[this.dataset.action == 'next' ? 'next': 'prev']().css('display', '');
        }
        if (rect.top < 0) {
            $this.form[0].scrollIntoView(true);
        }
        if (this.dataset.action == 'next' && ('grecaptcha' in window)) {
            page.find('.ba-form-submit-field').each(function(){
                formsApp.initFormsRecaptcha(this);
            });
        }
    });
    this.form.find('.upload-file-btn').each(function(){
        this.file = this.closest('.upload-file-input').querySelector('input[type="file"]');
    }).on('click', function(){
        formsApp.removeAlertTooltip(this.file);
        if (this.file.uploading != 'pending') {
            this.file.click();
        }
    });
    this.form.find('.drag-drop-upload-file').on('dragenter dragover', function(event){
        event.preventDefault();
        event.stopPropagation();
        this.classList.add('upload-file-drag-over');
        return false;
    }).on('dragleave', function(event){
        event.preventDefault();
        event.stopPropagation();
        this.classList.remove('upload-file-drag-over');        
        return false;
    }).on('drop', function(event){
        event.preventDefault();
        event.stopPropagation();
        this.classList.remove('upload-file-drag-over');
        var files = event.originalEvent.target.files || event.originalEvent.dataTransfer.files;
        $f(this).find('.ba-forms-attachment').each(function(){
            this.files = files;
        }).trigger('change');
    });
    this.form.find('input[type="file"].ba-forms-attachment').each(function(){
        this.options = {
            id: $this.formId,
            size: this.dataset.size * 1000,
            types: this.dataset.types.replace(/\s/g, '').split(','),
            count: this.multiple ? this.dataset.count : 1,
            images: new Array('gif', 'jpg', 'jpeg', 'png', 'svg', 'webp'),
            fileContainer: this.closest('.ba-field-container').querySelector('.ba-forms-xhr-attachment-wrapper[data-type="file"]'),
            imageContainer: this.closest('.ba-field-container').querySelector('.ba-forms-xhr-attachment-wrapper[data-type="image"]')
        }
        this.uploads = {
            count: 0
        }
    }).on('change', function(){
        this.uploading = 'pending';
        let files = [].slice.call(this.files),
            uploaded = {},
            msg = '';
        for (let ind in this.uploads) {
            if (ind == 'count') {
                continue;
            }
            uploaded[this.uploads[ind].name] = true;
        }
        if (this.options.count != '' && this.uploads.count == this.options.count * 1) {
            msg = 'MAXIMUM_FILES_NUMBER_EXCEEDED';
        } else {
            for (let i = 0; i < files.length; i++) {
                let name = files[i].name.split('.');
                files[i].ext = name[name.length - 1].toLowerCase()
                if (this.options.size < files[i].size) {
                    msg = 'NOT_ALLOWED_FILE_SIZE';
                    break;
                } else if (this.options.types.indexOf(files[i].ext) == -1) {
                    msg = 'NOT_SUPPORTED_FILE';
                    break;
                } else if (uploaded[files[i].name]) {
                    msg = 'FILES_ALREADY_UPLOADED';
                    break;
                }
            }
        }
        this.value = '';
        if (msg != '') {
            this.uploading = '';
            formsApp.showNotice(formsApp._(msg), 'ba-alert');
        } else {
            formsApp.uploadAttachmentFile(files, this, $this);
        }
    });
    this.form.find('.ba-form-save-progress-link').on('click', function(){
        let progress = formsApp.getProgressData($this);
        if (!formsApp.storage[progress.url]) {
            formsApp.storage[progress.url] = {};
        }
        formsApp.storage[progress.url][progress.id] = progress;
        localStorage.setItem('forms-progress', JSON.stringify(formsApp.storage));
        formsApp.showNotice(formsApp._('PROGRESS_SAVED_MESSAGE'));
    });
    this.form.find('.ba-form-map-field .ba-map-wrapper').each(function(){
        this.options = {
            map: JSON.parse(this.dataset.map),
            marker: JSON.parse(this.dataset.marker),
            controls: Boolean(this.dataset.controls * 1),
            styleType: this.dataset.styleType
        }
        if (formsApp.googleMaps || (('google' in window) && google.maps)) {
            formsApp.createGoogleMap(this, this.options);
        }
    }).removeAttr('data-map').removeAttr('data-marker').removeAttr('data-controls').removeAttr('data-style-type');
    this.form.find('.ba-input-password-icons i').on('click', function(){
        let input = this.closest('.ba-field-container').querySelector('input'),
            icons = this.closest('.ba-input-password-icons').querySelectorAll('i');
        this.style.display = 'hide';
        if (this.dataset.action == 'show') {
            input.type = 'text';
            icons[1].style.display = '';
        } else {
            input.type = 'password';
            icons[0].style.display = '';
        }
    });
    this.form.find('.ba-form-calendar-field input[type="text"]').each(function(){
        this.rangeBtn = $f(this).closest('.calendar-range-type').find('input[type="text"]').not(this)[0];
        this.hiddenInput = this.closest('.ba-field-container').querySelector('input[type="hidden"]');
    });
    this.form.find('.ba-form-calendar-field input[type="text"]').on('click', function(){
        formsApp.removeAlertTooltip(this);
        if (this.rangeBtn && this.dataset.index == 1 && !this.rangeBtn.value) {
            this.rangeBtn.click();
            return false;
        }
        if (!formsApp.calendar) {
            formsApp.createCalendar(this);
        }
        formsApp.calendar.disable = {
            days: [],
            dates: [],
            range: []
        };
        if (this.dataset.disableDays) {
            formsApp.calendar.disable.days = this.dataset.disableDays.split(',');
            let pos = formsApp.calendar.disable.days.indexOf('0');
            if (this.dataset.start == 1 && pos != -1) {
                formsApp.calendar.disable.days[pos] = '7';
            }
        }
        if (this.dataset.disableDates) {
            formsApp.calendar.disable.dates = this.dataset.disableDates.split(',');
        }
        if (this.dataset.disableRangeDates) {
            formsApp.calendar.disable.range = this.dataset.disableRangeDates.split(',');
        }
        if (this.dataset.disablePrevious == 1) {
            formsApp.calendar.classList.add('disable-previous-date');
        }
        formsApp.calendar.dataset.form = $this.form.attr('data-id');
        formsApp.calendar.start = this.dataset.start;
        formsApp.renderFormsCalendar(this);
    }).on('input', function(){
        if (this.rangeBtn && this.dataset.index == 0) {
            this.rangeBtn.value = '';
        }
        this.hiddenInput.price = 0;
        if (!this.rangeBtn) {
            this.hiddenInput.value = this.value;
        } else if (this.rangeBtn && this.dataset.index == 0) {
            this.hiddenInput.value = this.value+' - '+this.rangeBtn.value;
        } else {
            this.hiddenInput.value = this.rangeBtn.value+' - '+this.value;
            var date1 = new Date(this.rangeBtn.dataset.value),
                date2 = new Date(this.value);
            this.hiddenInput.price = Math.ceil(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 3600 * 24))
        }
        formsApp.updateFieldsValues($this.fields, this.hiddenInput, this.hiddenInput.fieldId);
        formsApp.checkConditionLogic($this, $this.fields);
        formsApp.calculation($this);
    });
    this.form.find('.ba-form-address-field input').each(function(){
        this.createAutocomplete = function(){
            let autocomplete = new google.maps.places.Autocomplete(this),
                input = this;
            autocomplete.addListener('place_changed', function(){
                formsApp.updateFieldsValues($this.fields, input, input.fieldId);
                formsApp.checkConditionLogic($this, $this.fields);
            });
        }
        if (formsApp.googleMaps || (('google' in window) && google.maps)) {
            this.createAutocomplete();
        }
    }).on('input', function(){
        formsApp.updateFieldsValues($this.fields, this, this.fieldId);
        formsApp.checkConditionLogic($this, $this.fields);
    }).on('focus', function(){
        formsApp.removeAlertTooltip(this);
    });
    this.form.find('.ba-form-slider-field .form-range-wrapper input').each(function(){
        let parent = this.closest('.ba-field-container');
        this.linear = parent.querySelector('.ba-form-range-liner');
        this.number = parent.querySelector('.form-slider-input-wrapper input[data-type="range"]');
        this.input = parent.querySelector('.form-slider-input-wrapper input[type="hidden"][name]');
        this.number.range = this;
    }).on('input', function(){
        var max = this.max * 1,
            min = this.min * 1,
            value = this.value * 1,
            sx = (value - min) * 100 / (max - min);
        this.input.value = value;
        this.number.value = this.value;
        this.linear.style.width = sx+'%';
        formsApp.updateFieldsValues($this.fields, this.input, this.input.fieldId);
        formsApp.checkConditionLogic($this);
        formsApp.calculation($this);
    });
    this.form.find('.ba-form-slider-field .form-slider-input-wrapper input[data-type="range"]').on('input', function(){
        var max = this.range.max * 1,
            min = this.range.min * 1,
            value = this.value * 1;
        if (value > max) {
            this.value = value = max;
        }
        if (value >= min) {
            this.range.value = value;
            $f(this.range).trigger('input');
        }
    });
    this.form.find('.ba-form-slider-field .form-slider-wrapper input[type="range"]').each(function(){
        let parent = this.closest('.ba-field-container');
        this.linear = parent.querySelector('.ba-form-range-liner');
        this.slides = parent.querySelectorAll('input[type="range"]');
        this.numbers = parent.querySelectorAll('.form-slider-input-wrapper input[data-type="slider"]');
        this.numbers[0].slides = this.slides;
        this.numbers[1].slides = this.slides;
        this.input = parent.querySelector('.form-slider-input-wrapper input[type="hidden"][name]');
        if (!this.input.values) {
            this.input.values = new Array();
        }
        this.input.values.push(this.value);
    }).on('input', function(){
        var max = this.max * 1,
            min = this.min * 1,
            ind = this.dataset.index * 1,
            index = ind == 0 ? 1 : 0,
            value = this.value * 1,
            value2 = this.slides[index].value * 1,
            sx = left = 0;
        if (this.slides[0].value * 1 > this.slides[1].value * 1) {
            ind = ind == 0 ? 1 : 0;
            index = index == 0 ? 1 : 0;
        }
        this.input.values[index] = value2;
        this.numbers[index].value = value2;
        this.numbers[ind].value = value;
        this.input.values[ind] = value;
        this.input.value = this.input.values[0]+' '+this.input.values[1];
        sx = (this.input.values[1] * 1 - this.input.values[0] * 1) * 100 / (max - min)
        left = (max - this.input.values[1] * 1) * 100 / (max - min);
        this.linear.style.width = sx+'%';
        this.linear.style.marginLeft = (100 - sx - left)+'%';
        formsApp.updateFieldsValues($this.fields, this.input, this.input.fieldId);
        formsApp.checkConditionLogic($this);
    });
    this.form.find('.ba-form-slider-field .form-slider-input-wrapper input[data-type="slider"]').on('input', function(){
        let $this = this
        clearTimeout(this.delay);
        this.delay = setTimeout(function(){
            if ($this.value) {
                let value = $this.value * 1,
                    values = $this.slides[0].input.values,
                    index = $this.dataset.index * 1;
                if (index == 0 && value > values[1] * 1) {
                    index = 1;
                    $this.slides[1].numbers[1].focus();
                    $this.value = values[1];
                    $this.slides[0].input.values[0] = $this.value;
                    $f($this.slides[0]).val($this.value);
                } else if (index == 1 && value < values[0] * 1) {
                    index = 0;
                    $this.slides[0].numbers[0].focus();
                    $this.value = values[0];
                    $this.slides[0].input.values[1] = $this.value;
                    $f($this.slides[1]).val($this.value);
                }
                $this.slides[index].value = value;
                $f($this.slides[index]).trigger('input');
            }
        }, 500);
    });
    this.form.find('.ba-form-phone-field').on('click', function(){
        formsApp.removeAlertTooltip(this.querySelector('input.ba-phone-number-input'));
    }).on('click', '.ba-phone-selected-country', function(){
        let wrapper = this.closest('.ba-phone-countries-wrapper'),
            search = wrapper.querySelector('.ba-phone-countries-search');
        setTimeout(function(){
            wrapper.querySelectorAll('li').forEach(function(el){
                el.style.display = '';
            });
            wrapper.classList.remove('top-countries-list');
            wrapper.classList.add('visible-countries-list');
            let rect = wrapper.querySelector('ul').getBoundingClientRect();
            if (window.innerHeight < rect.bottom) {
                wrapper.classList.add('top-countries-list');
            }
            search.value = '';
            search.focus();
            $f('body').off('click.selected-country').one('click.selected-country', function(){
                $f('.visible-countries-list').removeClass('visible-countries-list');
            });
        }, 100);
    }).on('input', '.ba-phone-countries-search', function(){
        var li = this.closest('.ba-phone-countries-wrapper').querySelectorAll('li'),
            search = this.value.toLowerCase();
        clearTimeout(this.delay);
        this.delay = setTimeout(function(){
            li.forEach(function(el){
                let title = el.dataset.title.toLowerCase();
                el.style.display = !search || title.indexOf(search) != -1 ? '' : 'none';
            });
        }, 300);
    }).on('click', '.ba-phone-countries-search', function(event){
        event.stopPropagation();
    }).on('click', '.ba-phone-countries-list li.ba-phone-country-item', function(){
        let wrapper = this.closest('.ba-field-container');
        if (!wrapper.phoneInput) {
            wrapper.countryFlag = wrapper.querySelector('.ba-phone-selected-country .ba-phone-flag');
            wrapper.countryPrefix = wrapper.querySelector('.ba-phone-selected-country .ba-phone-prefix');
            wrapper.phoneInput = wrapper.querySelector('input.ba-phone-number-input');
        }
        wrapper.countryFlag.className = 'ba-phone-flag ba-phone-flag-'+this.dataset.flag;
        wrapper.countryPrefix.textContent = this.dataset.prefix;
        wrapper.phoneInput.placeholder = this.dataset.placeholder;
        wrapper.phoneInput.value = '';
        wrapper.phoneInput.formsInputMask = this.dataset.placeholder;
        wrapper.phoneInput.dataset.prefix = this.dataset.prefix;
        wrapper.phoneInput.dispatchEvent(wrapper.phoneInput.inputEvent);
        formsApp.prepareInputMask(wrapper.phoneInput, wrapper.phoneInput.formsInputMask);
    }).on('keydown', 'input.ba-phone-number-input', function(event){
        formsApp.prepareInputMask(this, this.formsInputMask, event);
    }).on('input', 'input.ba-phone-number-input', function(){
        formsApp.executeInputMask(this, this.formsInputMask);
        this.hiddenInput.value = this.value ? this.dataset.prefix+' '+this.value : '';
        this.hiddenInput.dispatchEvent(this.inputEvent);
    }).find('input.ba-phone-number-input').each(function(){
        this.prefix = this.dataset.prefix;
        this.formsInputMask = this.placeholder;
        formsApp.prepareInputMask(this, this.formsInputMask);
        this.hiddenInput = this.closest('.ba-field-container').querySelector('input[type="hidden"]');
        this.hiddenInput.addEventListener('input', function(){
            formsApp.updateFieldsValues($this.fields, this, this.fieldId);
            formsApp.checkConditionLogic($this);
            formsApp.calculation($this);
        });
        this.inputEvent = new Event('input');
    });
    this.form.find('.ba-form-input-field > .ba-input-wrapper').find('[data-mask]').each(function(){
        this.formsInputMask = this.dataset.mask.replace(/#/g, '_');
        formsApp.prepareInputMask(this, this.formsInputMask);
    }).on('keydown', function(event){
        formsApp.prepareInputMask(this, this.formsInputMask, event);
    }).on('input', function(event){
        formsApp.executeInputMask(this, this.formsInputMask);
    });
    this.form.find('.characters-wrapper').each(function(){
        let input = this.closest('.ba-field-container').querySelector('input, textarea');
        input.characters = {
            div: this,
            key: this.dataset.direction,
            length: this.dataset.length
        }
    });
    this.form.find('.ba-form-input-field > .ba-input-wrapper').find('input, textarea').on('input', function(){
        if (this.characters) {
            let length = this.value.length;
            this.characters.div.querySelector('.current-characters').textContent = length;
        }
        formsApp.updateFieldsValues($this.fields, this, this.fieldId);
        formsApp.checkConditionLogic($this);
        formsApp.calculation($this);
    }).on('focus', function(){
        formsApp.removeAlertTooltip(this);
    });
    this.form.find('.confirm-email-wrapper, .confirm-password-wrapper').find('input').on('focus', function(){
        formsApp.removeAlertTooltip(this);
    });
    this.form.find('.ba-form-dropdown-field, .ba-form-select-multiple-field').find('select').on('focus', function(){
        formsApp.removeAlertTooltip(this);
    }).on('change', function(){
        $this.fields[this.fieldId] = {
            value: '',
            price: 0
        }
        formsApp.updateFieldsValues($this.fields, this, this.fieldId);
        formsApp.checkConditionLogic($this);
        formsApp.calculation($this);
        formsApp.checkAutoNavigation($this, this);
        if (this.product) {
            formsApp.productChange($this, this.name);
        }
    });
    this.form.find('.ba-form-rating-group-wrapper').on('change', function(){
        formsApp.removeAlertTooltip(this);
        let input = this.querySelectorAll('input');
        $this.fields[input[0].fieldId] = {
            value: '',
            price: 0
        }
        this.classList.remove('active');
        $f(this).find('label.active').removeClass('active');
        for (let i = 0; i < input.length; i++) {
            formsApp.updateFieldsValues($this.fields, input[i], input[i].fieldId);
            if (input[i].checked) {
                this.classList.add('active');
                input[i].closest('label').classList.add('active');
            }
        }
        formsApp.checkConditionLogic($this);
        formsApp.calculation($this);
        formsApp.checkAutoNavigation($this, this);
    });
    this.form.find('.ba-form-checkbox-group-wrapper').each(function(){
        if (this.querySelector('.ba-checkbox-image')) {
            this.classList.add('checkbox-image-group-wrapper');
        }
        let checkbox = this.querySelector('.ba-form-checkbox-wrapper:last-child');
        if (!checkbox.classList.contains('last-row-checkbox-wrapper')) {
            checkbox.classList.add('last-row-checkbox-wrapper')
        }
    }).on('change', function(){
        formsApp.removeAlertTooltip(this);
        let input = this.querySelectorAll('input'),
            name = product = null,
            image = this.classList.contains('checkbox-image-group-wrapper');
        $this.fields[input[0].fieldId] = {
            value: '',
            price: 0
        }
        if (image) {
            $f(this).find('.checked-image-container').removeClass('checked-image-container');
        }
        for (let i = 0; i < input.length; i++) {
            formsApp.updateFieldsValues($this.fields, input[i], input[i].fieldId);
            name = input[i].name;
            product = input[i].product;
            if (input[i].checked) {
                input[i].closest('.ba-form-checkbox-wrapper').classList.add('checked-image-container');
            }
        }
        formsApp.checkConditionLogic($this);
        formsApp.calculation($this);
        formsApp.checkAutoNavigation($this, this);
        if (product && name) {
            formsApp.productChange($this, name);
        }
    }).find('.ba-form-checkbox-wrapper').on('click', function(event){
        if (!event.target.classList.contains('ba-form-checkbox') && !event.target.closest('.ba-form-checkbox') &&
            !event.target.closest('.ba-form-radio')) {
            $f(this).find('> .ba-checkbox-wrapper input').each(function(){
                if (this.type == 'radio' && !this.checked) {
                    this.checked = true;
                } else if (this.type == 'checkbox') {
                    this.checked = !this.checked;
                }
            }).trigger('change');
        }
    });
    this.form.find('.ba-form-acceptance-field .ba-field-container').on('change', function(){
        formsApp.removeAlertTooltip(this);
        let input = this.querySelector('input');
        $this.fields[input.fieldId] = {
            value: '',
            price: 0
        }
        formsApp.updateFieldsValues($this.fields, input, input.fieldId);
        formsApp.checkConditionLogic($this);
    });
    this.form.find('[data-price]').each(function(){
        this.price = this.dataset.price;
    }).removeAttr('data-price');
    this.form.find('[data-field-id]').each(function(){
        this.fieldId = this.dataset.fieldId;
        $this.items[this.fieldId] = this.closest('.ba-form-field-item');
        if (this.classList.contains('ba-form-submit-btn')) {
            return true;
        }
        if (!$this.fields[this.fieldId]) {
            $this.fields[this.fieldId] = {
                value: '',
                price: 0
            }
        }
        formsApp.updateFieldsValues($this.fields, this, this.fieldId);
    }).removeAttr('data-field-id');
    this.form.find('[data-default]').each(function(){
        let match = this.dataset.default.match(/\[Field ID=\d+\]/) || this.dataset.default.match(/\[Page Title\]/);
        match = match || this.dataset.default.match(/\[Page URL\]/);
        if (this.dataset.default && match) {
            let key = this.fieldId ? this.fieldId : +new Date(),
                obj =  {
                    item: this,
                    value: this.dataset.default
                }
            defaultValues[key] = obj;
        }
    });
    this.form.find('.ba-form-calculation-field .field-price-value').each(function(){
        this.calculation = $f.extend({}, this.dataset);
        this.calculation.result = this;
        this.calculation.input = this.closest('.ba-field-container').querySelector('input');
        for (ind in this.dataset) {
            $f(this).removeAttr('data-'+ind)
        }
        $this.calculation[this.calculation.input.fieldId] = this.calculation;
    });
    this.form.find('.ba-form-calculation-field input[type="hidden"]').on('change', function(){
        formsApp.updateFieldsValues($this.fields, this, this.fieldId);
        formsApp.checkConditionLogic($this);
        if (this.product) {
            formsApp.productChange($this, this.name);
        }
    });
    this.form.find('.ba-form-total-field .ba-cart-total-row .field-price-value').each(function(){
        this.calculation = $f.extend({}, this.dataset);
        let calculation = this.calculation;
        calculation.subtotal = this.closest('.ba-cart-total-container').querySelector('.ba-cart-subtotal-row .field-price-value');
        calculation.result = this;
        calculation.input = this.closest('.ba-form-calculation-price-wrapper').querySelector('textarea');
        calculation.cart = this.closest('.ba-input-wrapper').querySelector('.ba-form-products-cart');
        calculation.products = {};
        calculation.total = 0;
        calculation.resultTotal = 0;
        calculation.discount = this.closest('.ba-cart-total-container').querySelector('.ba-cart-discount-row .field-price-value');
        calculation.taxResult = this.closest('.ba-cart-total-container').querySelector('.ba-cart-tax-row .field-price-value');
        calculation.shipping = this.closest('.ba-cart-total-container').querySelectorAll('.ba-cart-shipping-row input[type="radio"]');
        calculation.shipping.forEach(function(el){
            el.addEventListener('change', function(){
                formsApp.calculateCartTotal(calculation);
            })
        });
        $this.carts.push(this);
        for (ind in this.dataset) {
            $f(this).removeAttr('data-'+ind)
        }
    });
    this.form.find('.ba-cart-promo-code-btn').each(function(){
        this.promo = {
            input: this.closest('.ba-cart-promo-code-container').querySelector('.ba-cart-promo-code-input'),
            total: this.closest('.ba-field-container').querySelector('.ba-cart-total-row .field-price-value'),
            discount: this.closest('.ba-field-container').querySelector('.ba-cart-discount-row')
        }
    }).on('click', function(){
        if (this.status != 'pending') {
            this.status = 'pending';
            let btn = this;
            $f.ajax({
                type:"POST",
                data: {
                    coupon: this.promo.input.value.trim(),
                    id: this.dataset.name
                },
                dataType:'text',
                url: 'index.php?option=com_baforms&task=form.checkCoupon',
                complete: function(msg){
                    btn.status = '';
                    if (!msg.responseText || !btn.promo.input.value.trim()) {
                        formsApp.showNotice(formsApp._('PROMO_CODE_NOT_VALID'), 'ba-alert');
                        btn.promo.total.calculation.promo = null;
                        btn.promo.discount.style.display = 'none';
                    } else {
                        btn.promo.total.calculation.promo = JSON.parse(msg.responseText);
                        btn.promo.discount.style.display = '';
                    }
                    formsApp.calculateCartTotal(btn.promo.total.calculation);
                }
            });
        }
    })
    this.form.find('[data-product]').each(function(){
        if (this.dataset.product) {
            this.product = this.dataset.product;
            let name = this.name;
            if (!$this.products[name]) {
                $this.products[name] = new Array();
            }
            if (this.localName == 'select') {
                this.querySelectorAll('option').forEach(function(option){
                    $this.products[name].push(option);
                });
            } else {
                $this.products[name].push(this);
            }
        }
    }).removeAttr('data-product');
    formsApp.updateFieldsDefaultValues($this, defaultValues);
    formsApp.getProgress($this);
    formsApp.checkConditionLogic($this);
    formsApp.calculation($this);
    formsApp.updateCarts($this);
}

formsApp.productChange = function($this, name){
    for (let i = 0; i < $this.carts.length; i++) {
        if (!$this.carts[i].calculation.products[name]) {
            continue;
        }
        let calculation = $this.carts[i].calculation;
        formsApp.updateProducts($this, calculation, name);
    }
}

formsApp.updateCarts = function($this){
    for (let i = 0; i < $this.carts.length; i++) {
        let calculation = $this.carts[i].calculation;
        for (let name in $this.products) {
            if (!calculation.products[name]) {
                calculation.products[name] = {};
            }
            formsApp.updateProducts($this, calculation, name);
        }
    }

}

formsApp.updateProducts = function($this, calculation, name){
    let products = $this.products[name],
        object = {};
    for (let i = 0; i < products.length; i++) {
        if (products[i].closest('.hidden-condition-field')) {
            continue;
        }
        if (products[i].price != '' && (((products[i].type == 'radio' || products[i].type == 'checkbox') && products[i].checked)
            || (products[i].localName == 'option' && products[i].selected) || products[i].type == 'hidden')) {
            let obj = {
                input: products[i],
                quantity:1,
                title: products[i].dataset.title ? products[i].dataset.title : products[i].value,
                price: products[i].price
            }
            obj.total = obj.price * obj.quantity;
            object[i] = obj;
        }
    }
    for (let ind in calculation.products[name]) {
        if (!object[ind] || calculation.products[name][ind].input.type == 'hidden') {
            calculation.total -= calculation.products[name][ind].total;
            if (calculation.cart) {
                calculation.cart.querySelector('.ba-form-product-row[data-name="'+name+'"][data-ind="'+ind+'"]').remove();
            }
            delete calculation.products[name][ind];
        }
    }
    for (let ind in object) {
        if (!calculation.products[name][ind]) {
            if (Number.isNaN(object[ind].total)) {
                object[ind].total = 0;
            }
            calculation.total += object[ind].total;
            if (calculation.cart) {
                let div = formsApp.getProductCartHTML(object[ind], name, ind, calculation);
                calculation.cart.append(div);
            }
            calculation.products[name][ind] = object[ind];
        }
    }
    calculation.total = formsApp.decimalAdjust('round', calculation.total, calculation.decimals * -1);
    formsApp.calculateCartTotal(calculation);
}

formsApp.calculateCartTotal = function(calculation)
{
    let price = formsApp.renderPrice(String(calculation.total), calculation.thousand, calculation.separator, calculation.decimals),
        total = calculation.total,
        tax = 0,
        discount = calculation.promo ? calculation.promo.discount * 1 : 0;
    if (calculation.subtotal) {
        calculation.subtotal.textContent = price;
    }
    if (calculation.taxResult) {
        tax = total * calculation.tax / 100
        price = formsApp.renderPrice(String(tax), calculation.thousand, calculation.separator, calculation.decimals)
        calculation.taxResult.textContent = price;
    }
    total += tax;
    if (calculation.promo && calculation.promo.unit == '%') {
        discount = total * discount / 100;
    }
    total -= discount;
    if (calculation.discount) {
        price = formsApp.renderPrice(String(discount), calculation.thousand, calculation.separator, calculation.decimals);
        calculation.discount.textContent = '-'+price;
    }
    if (calculation.shipping) {
        calculation.shipping.forEach(function(input){
            if (input.checked) {
                total += input.price * 1;
            }
        });
    }
    calculation.resultTotal = total;
    price = formsApp.renderPrice(String(total), calculation.thousand, calculation.separator, calculation.decimals)
    calculation.result.textContent = price;
}

formsApp.getProductCartHTML = function(product, name, ind, calculation){
    let div = document.createElement('div'),
        price = formsApp.renderPrice(String(product.total), calculation.thousand, calculation.separator, calculation.decimals),
        image = product.input.closest('.checkbox-image-wrapper');
    div.className = 'ba-form-product-row';
    div.dataset.name = name;
    div.dataset.ind = ind;
    div.innerHTML = '<div class="ba-form-product-title-cell">'+product.title+'</div>'+
        '<div class="ba-form-product-quantity-cell"><i class="zmdi zmdi-minus-circle-outline '+
        (product.quantity == 1 ? 'ba-disabled' : '')+'" data-action="-"></i>'+
        '<input type="number" value="'+product.quantity+'" min="1" step="1"><i class="zmdi zmdi-plus-circle-o" data-action="+"></i></div>'+
        '<div class="ba-form-product-total-cell"><div class="ba-form-calculation-price-wrapper">'+
        '<span class="field-price-currency">'+calculation.symbol+'</span><span class="field-price-value">'+price+'</span></div>'+
        '</div><div class="ba-form-product-remove-cell"><i class="zmdi zmdi-delete"></i></div>';
    if (image) {
        let img = document.createElement('div');
        img.className = 'ba-form-product-image-cell';
        img.append(image.querySelector('img').cloneNode());
        div.insertBefore(img, div.querySelector('.ba-form-product-title-cell'));
    }
    let input = div.querySelector('.ba-form-product-quantity-cell input'),
        trash = div.querySelector('.ba-form-product-remove-cell i'),
        quantityBtns = div.querySelectorAll('.ba-form-product-quantity-cell i[data-action]');
    quantityBtns.forEach(function(element){
        element.addEventListener('click', function(){
            if (this.classList.contains('ba-disabled')) {
                return false;
            }
            if (this.dataset.action == '+') {
                input.value = input.value * 1 + 1;
            } else {
                input.value = input.value * 1 - 1;
            }
            let event = new Event('input');
            input.dispatchEvent(event);
        });
    });
    input.addEventListener('input', function(){
        if (this.value != '') {
            quantityBtns[0].classList[this.value == 1 ? 'add' : 'remove']('ba-disabled');
            let match = this.value.match(/\d+/);
            if (!match || match[0] == 0) {
                this.value = 1;
            } else if (match[0] != this.value) {
                this.value = match[0];
            }
            if (this.value * 1 > 0) {
                calculation.total -= product.total;
                product.quantity = this.value * 1;
                product.total = product.price * product.quantity;
                price = formsApp.renderPrice(String(product.total), calculation.thousand, calculation.separator, calculation.decimals)
                div.querySelector('.field-price-value').textContent = price;
                calculation.total += product.total;
                formsApp.calculateCartTotal(calculation);
            }
        }
    });
    trash.addEventListener('click', function(){
        if (product.input.type == 'hidden') {
            calculation.total -= product.total;
            delete calculation.products[name][ind];
            div.remove();
            price = formsApp.renderPrice(String(calculation.total), calculation.thousand, calculation.separator, calculation.decimals);
            calculation.result.textContent = price;
        } else {
            product.input[product.input.localName == 'option' ? 'selected' : 'checked'] = false;
            $f(product.input).trigger('change');
        }
    });

    return div;
}

formsApp.decimalAdjust = function(type, value, exp){
    if (typeof exp === 'undefined' || +exp === 0) {
        return Math[type](value);
    }
    value = +value;
    exp = +exp;
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    value = value.toString().split('e');

    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

formsApp.calculation = function($this){
    formsApp.calculated = {};
    for (let i in $this.calculation) {
        formsApp.calculated[i] = 0;
        let calc = $this.calculation[i],
            total = formsApp.calculate(calc.formula, $this),
            price = String(total);
        total = formsApp.decimalAdjust('round', total, calc.decimals * -1);
        price = String(total);
        calc.input.price = total;
        if (total != calc.input.value * 1) {
            formsApp.calculated[i] = total;
            price = formsApp.renderPrice(price, calc.thousand, calc.separator, calc.decimals);
            calc.input.value = total;
            calc.result.textContent = price;
            $f(calc.input).trigger('change');
        }
    }
}

formsApp.calculate = function(formula, $this){
    if (formula == '') {
        return 0;
    }
    formula = formula.replace(/\s/g, '');
    let matches = formula.match(/\[FieldID=\d+\]/g),
        total = 0;
    if (matches) {
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i].match(/\d+/g),
                price = $this.fields['baform-'+match[0]] ? $this.fields['baform-'+match[0]].price : 0;
            if (!$this.items['baform-'+match[0]] || $this.items['baform-'+match[0]].closest('.hidden-condition-field')) {
                price = 0;
            } else  if ('baform-'+match[0] in formsApp.calculated) {
                price = formsApp.calculated['baform-'+match[0]];
            } else if ($this.calculation['baform-'+match[0]]) {
                formsApp.calculated['baform-'+match[0]] = 0;
                price = formsApp.calculate($this.calculation['baform-'+match[0]].formula, $this)
                formsApp.calculated['baform-'+match[0]] = price;
            }
            formula = formula.replace(matches[i], price);
        }
    }
    try {
        total = eval(formula);
    } catch (error) {
        console.error(error)
    }
    if (total == -Infinity || total == Infinity || Number.isNaN(total)) {
        total = 0;
    }

    return total;
}

formsApp.getProgress = function($this){
    if (formsApp.storage[$this.formURL] && formsApp.storage[$this.formURL][$this.formId]) {
        let data = formsApp.storage[$this.formURL][$this.formId];
        for (let i = 0; i < data.fields.length; i++) {
            let input = $this.form.find('[name="'+data.fields[i].name+'"]'),
                obj = data.fields[i];
            if (!input.length) {
                continue;
            }
            switch (obj.type) {
                case 'input' :
                case 'address':
                    if (input[0].formsInputMask) {
                        input[0].setSelectionRange(0, 0);
                        input[0].setRangeText(obj.data.value);
                    } else {
                        input.val(obj.data.value);
                    }
                    input.trigger('input');
                    if ('confirm' in obj.data) {
                        input.closest('.ba-form-field-item').find('.confirm-email-wrapper input').val(obj.data.confirm);
                    }
                    if ('password' in obj.data) {
                        input.closest('.ba-form-field-item').find('.confirm-password-wrapper input').val(obj.data.password);
                    }
                    break;
                case 'phone':
                    let parent = input.closest('.ba-field-container');
                    parent.find('.ba-phone-country-item[data-flag="'+obj.data.flag+'"]').trigger('click');
                    parent.find('.ba-phone-number-input').each(function(){
                        this.setSelectionRange(0, 0);
                        this.setRangeText(obj.data.value);
                    }).trigger('input');
                    break;
                case 'calendar':
                    let value = obj.data.value.split(' - ');
                    input.closest('.ba-field-container').find('input[type="text"]').each(function(i){
                        this.value = value[i];
                    }).trigger('input');
                    break;
                case 'radio':
                case 'checkbox':
                case 'rating':
                    input.each(function(){
                        if (obj.data.checked.indexOf(this.value) != -1) {
                            this.checked = true;
                            $f(this).trigger('change');
                        }
                    });
                    break;
                case 'select':
                case 'selectMultiple':
                    input.find('option').each(function(){
                        if (obj.data.selected.indexOf(this.value) != -1) {
                            this.selected = true;
                            input.trigger('change');
                        }
                    });
                    break;
                case 'acceptance':
                    if (obj.data.selected) {
                        input.prop('checked', obj.data.selected);
                    }
                    break;
                case 'slider':
                    let range = input.closest('.ba-field-container').find('input[type="range"]');
                    input.value = obj.data.value;
                    if (obj.data.type == 'range') {
                        range.val(obj.data.value).trigger('input');
                    } else {
                        let array = obj.data.value.split(' ');
                        range.first().val(array[0]).trigger('input');
                        range.last().val(array[1]).trigger('input');
                    }
                    break;
                case 'upload':
                    let file = input.closest('.upload-file-input').find('.ba-forms-attachment')[0];
                    file.uploads = obj.data.uploads;
                    for (let ind in file.uploads) {
                        if (ind == 'count') {
                            continue;
                        }
                        let name = file.uploads[ind].name.split('.'),
                            ext = name[name.length - 1].toLowerCase(),
                            type = file.options.images.indexOf(ext) == -1 ? 'file' : 'image',
                            attachment = formsApp.getAttachmentHTML(file, type, file.uploads[ind].name);
                        attachment.dataset.id = ind;
                        attachment.classList.add('forms-attachment-file-uploaded');
                        if (type == 'image') {
                            let img = JUri+uploads_storage+'/form-'+$this.formId+'/'+file.uploads[ind].filename;
                            attachment.querySelector('.attachment-intro-image').style.backgroundImage = 'url('+img+')';
                        }
                        file.options[type+'Container'].appendChild(attachment);
                    }
                    break;
            }
        }
    }
}

formsApp.updateFieldsDefaultValues = function($this, defaultValues){
    let object = {};
    for (let ind in defaultValues) {
        object[ind] = '';
        object[ind] = formsApp.updateFieldsDefaultValue($this, defaultValues, defaultValues[ind].value, object);
        defaultValues[ind].item.value = object[ind];
    }
}

formsApp.updateFieldsDefaultValue = function($this, defaultValues, value, object){
    let matches = value.match(/\[Field ID=\d+\]/g),
        title = $this.querySelector('input[name="page-title"]').value,
        url = $this.querySelector('input[name="page-url"]').value;
    if (matches) {
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i].match(/\d+/g),
                val = $this.fields['baform-'+match[0]].value;
            if ('baform-'+match[0] in object) {
                val = object[match[0]];
            } else if ('baform-'+match[0] in defaultValues) {
                object['baform-'+match[0]] = '';
                val = formsApp.updateFieldsDefaultValue($this, defaultValues, defaultValues['baform-'+match[0]].value, object);
                object['baform-'+match[0]] = val;
            }
        }
    }
    value = value.replace(/\[Page Title\]/g, title);
    value = value.replace(/\[Page URL\]/g, url);
    

    return value;
}

formsApp.updateFieldsValues = function(fields, $this, id){
    if ($this.type == 'radio' && $this.checked) {
        fields[id] = {
            value: $this.value,
            price: $this.price * 1
        }
    } else if ($this.type == 'checkbox' && $this.checked) {
        fields[id].value += fields[id].value != '' ? ' '+$this.value : $this.value;
        fields[id].price += $this.price * 1;
    } else if ($this.localName == 'select') {
        $f($this).find('option').each(function(){
            if (this.selected) {
                fields[id].value += fields[id].value != '' ? ' '+this.value : this.value;
                fields[id].price += this.price * 1;
            }
        });
    } else if ($this.dataset.calendar) {
        fields[id].value = $this.value;
        fields[id].price = $this.price * 1;
    } else if ($this.type == 'hidden' || $this.type == 'text' || $this.type == 'number'
        || $this.localName == 'textarea' || $this.type == 'email') {
        fields[id].value = $this.value;
        fields[id].price = $this.value * 1;
    } else if ($this.type == 'file') {
        fields[id].value = '';
        fields[id].price = $this.uploads.count;
    }
    if (String(fields[id].price) == 'NaN') {
        fields[id].price = 0;
    }
}

formsApp.checkConditionLogic = function($this){
    $this.pages = {};
    conditionLogic[$this.formId].forEach(function(el){
        if (!el.publish) {
            return true;
        }
        let flags = new Array(),
            page = null,
            value;
        el.when.forEach(function(obj){
            if (!obj.field || !obj.state) {
                return true;
            }
            if (!$this.fields['baform-'+obj.field]) {
                return true;
            }
            if ($this.items['baform-'+obj.field].classList.contains('hidden-condition-field')
                || $this.items['baform-'+obj.field].closest('.hidden-condition-field')) {
                flags.push(false);
                return true;
            }
            page = $this.items['baform-'+obj.field].closest('.ba-form-page');
            value = $this.fields['baform-'+obj.field].value;
            if ($this.items['baform-'+obj.field].dataset.type == 'checkbox'
                || $this.items['baform-'+obj.field].dataset.type == 'selectMultiple') {
                value = [];
                $this.items['baform-'+obj.field].querySelectorAll('input[name], option').forEach(function(input){
                    input.checked || input.selected ? value.push(input.value) : '';
                });
            }
            switch (obj.state) {
                case 'equal':
                    if (typeof value == 'string') {
                        flags.push(value == obj.value);
                    } else {
                        flags.push(value.indexOf(obj.value) != -1);
                    }
                    break;
                case 'not-equal':
                    if (typeof value == 'string') {
                        flags.push(value != obj.value);
                    } else {
                        flags.push(value.indexOf(obj.value) == -1);
                    }
                    break;
                case 'not-empty':
                    if (typeof value == 'string') {
                        flags.push(value != '');
                    } else {
                        flags.push(value.length != 0);
                    }
                    break;
                case 'empty':
                    if (typeof value == 'string') {
                        flags.push(value == '');
                    } else {
                        flags.push(value.length == 0);
                    }
                    break;
                case 'greater':
                    flags.push((!isNaN(value) ? value * 1 : value) > (!isNaN(obj.value) ? obj.value * 1 : obj.value));
                    break;
                case 'less':
                    flags.push((!isNaN(value) ? value * 1 : value) < (!isNaN(obj.value) ? obj.value * 1 : obj.value));
                    break;
                case 'contain':
                    flags.push(value.indexOf(obj.value) != -1);
                    break;
                case 'not-contain':
                    flags.push(value.indexOf(obj.value) == -1);
                    break;
            }
        });
        if (!flags.length) {
            return true;
        }
        let method = el.operation == 'OR' ? 'some' : 'every',
            flag = flags[method](function(state){return state});
        el.do.forEach(function(obj){
            if (obj.field && obj.action) {
                let item = $this.items['baform-'+obj.field] || $this.form[0].querySelector('.ba-form-page[data-page-key="'+obj.field+'"]');
                if (!item) {
                    return true;
                }
                if (obj.action == 'show' || obj.action == 'hide') {
                    let method = (obj.action == 'show' && flag) || (obj.action == 'hide' && !flag) ? 'remove' : 'add';
                    item.classList[method]('hidden-condition-field');
                    item.querySelectorAll('input[name], select[name], textarea[name]').forEach(function(itm){
                        if (itm.product) {
                            formsApp.productChange($this, itm.name);
                        }
                    });
                    if (item.classList.contains('ba-form-submit-field') && method == 'remove') {
                        formsApp.initFormsRecaptcha(item);
                    }
                } else if (obj.action == 'move' && flag) {
                    $this.pages[page.dataset.pageKey] = {
                        prev: page,
                        next: item
                    }
                    let hidden = [];
                    $f(page).nextAll('.ba-form-page').each(function(){
                        if (this == item) {
                            this.classList.remove('hidden-condition-field');
                            return false;
                        }
                        this.classList.add('hidden-condition-field');
                        hidden.push(this.dataset.pageKey);
                    });
                    $this.pages[page.dataset.pageKey].hidden = hidden;
                } else if (obj.action == 'move' && !flag && page) {
                    let pageKey = page.dataset.pageKey;
                    $f(page).nextAll('.ba-form-page').each(function(){
                        if (!$this.pages[pageKey] || $this.pages[pageKey].hidden.indexOf(this.dataset.pageKey) == -1) {
                            this.classList.remove('hidden-condition-field');
                        }
                        if (this == item) {
                            return false;
                        }
                    });
                }
            }
        });
        $f(window).trigger('scroll');
    });
}

formsApp.strrev = function(string){
    var ret = '', i = 0;
    for (i = string.length - 1; i >= 0; i--) {
        ret += string.charAt(i);
    }

    return ret;
}

formsApp.renderPrice = function(value, thousand, separator, decimals){
    let delta = value < 0 ? '-' : '',
        priceArray = value.replace('-', '').trim().split('.'),
        priceThousand = priceArray[0],
        priceDecimal = priceArray[1] ? priceArray[1] : '',
        price = '';
    if (priceThousand.length > 3 && thousand != '') {
        for (let i = 0; i < priceThousand.length; i++) {
            if (i % 3 == 0 && i != 0) {
                price += thousand;
            }
            price += priceThousand[priceThousand.length - 1 - i];
        }
        price = formsApp.strrev(price);
    } else {
        price += priceThousand;
    }
    if (decimals != 0) {
        price += separator;
        for (let i = 0; i < decimals; i++) {
            price += priceDecimal[i] ? priceDecimal[i] : '0';
        }
    }

    return delta+price;
}

function formsRecaptchaOnload()
{
    $f('.ba-form-submit-field').each(function(){
        formsApp.initFormsRecaptcha(this);
    });
}

formsApp.loadRecaptcha = function(){
    let script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=formsRecaptchaOnload&render=explicit';
    document.head.appendChild(script);
}

formsApp.getRecaptchaData = function(){
    $f.ajax({
        type:"POST",
        dataType:'text',
        url: 'index.php?option=com_baforms&task=form.getRecaptchaData',
        complete: function(msg){
            formsApp.recaptcha = JSON.parse(msg.responseText);
            formsApp.loadRecaptcha();
        }
    });
}

formsApp.initFormsRecaptcha = function(element){
    let captcha = element.querySelector('.ba-form-submit-btn').dataset.captcha,
        parent = $f(element).find('.ba-form-submit-recaptcha-wrapper');
    if ('grecaptcha' in window && captcha && formsApp.recaptcha[captcha] && !element.rendered && element.offsetHeight) {
        let div = document.createElement('div'),
            options = {
                sitekey : formsApp.recaptcha[captcha].public_key
            };
        div.id = 'forms-recaptcha-'+(+new Date());
        div.className = 'forms-recaptcha';
        div.dataset.captcha = captcha;
        parent.append(div);
        if (captcha == 'recaptcha') {
            options.theme = formsApp.recaptcha[captcha].theme;
            options.size = formsApp.recaptcha[captcha].size;
        } else {
            options.badge = formsApp.recaptcha[captcha].badge;
            options.size = 'invisible';
        }
        options.callback = formsVerifyCaptcha
        formsApp.recaptcha.data[div.id] = grecaptcha.render(div, options);
        element.rendered = true;
        if (captcha != 'recaptcha') {
            grecaptcha.execute(formsApp.recaptcha.data[div.id]);
        }
    }
}

function formsVerifyCaptcha(token){
    $f('.forms-recaptcha').each(function(){
        formsApp.removeAlertTooltip(this);
    });
}

formsApp.executeInputMask = function(input, mask){
    let n = input.beforeData.start + Math.abs(input.beforeData.value.length - input.value.length),
        pos = mask.indexOf('_'),
        text = [],
        delData = [],
        start = updateStart = null,
        value = mask;
    if (input.value.length > input.beforeData.value.length || input.value.length == input.beforeData.value.length) {
        let i = 0;
        for (i; i < input.beforeData.start; i++) {
            if (mask[i] == '_' && /\d/.test(input.beforeData.value[i])) {
                text.push(input.beforeData.value[i]);
            }
        }
        i = input.beforeData.start;
        n = input.value.length > input.beforeData.value.length ? n : input.beforeData.end;
        for (i; i < n; i++) {
            if (/\d/.test(input.value[i])) {
                text.push(input.value[i]);
            }
        }
        start = pos;
        for (i = 0; i < text.length; i++) {
            start = mask.indexOf('_', start + 1);
            if (start == -1) {
                start = mask.length;
            }
        }
        for (i = input.beforeData.end; i < input.beforeData.value.length; i++) {
            if (mask[i] == '_' && /\d/.test(input.beforeData.value[i])) {
                text.push(input.beforeData.value[i]);
            }
        }
    } else if (input.beforeData.start == 0 && input.beforeData.end == mask.length) {
        for (let i = 0; i < input.value.length; i++) {
            if (/\d/.test(input.value[i])) {
                text.push(input.value[i]);
            }
        }
        updateStart = true;
    } else if (input.beforeData.start < input.selectionStart) {
        let i = 0;
        for (i; i < input.selectionStart; i++) {
            if (mask[i] == '_' && /\d/.test(input.value[i])) {
                text.push(input.value[i]);
            }
        }
        start = i;
        for (let j = input.beforeData.end; j < input.beforeData.value.length; j++) {
            if (mask[j] == '_' && /\d/.test(input.beforeData.value[j])) {
                text.push(input.beforeData.value[j]);
            }
        }
    } else {
        let i = input.selectionStart < input.beforeData.start ? input.selectionStart : input.beforeData.start;
        n = input.selectionStart < input.beforeData.start ? input.beforeData.start : n;
        for (i; i < n; i++) {
            delData.push(i);
        }
    }
    if (delData.length == 1 && mask[delData[0]] != '_' && input.selectionStart < input.beforeData.start) {
        for (let i = input.selectionStart; i >= 0; i--) {
            if (mask[i] == '_') {
                delData[0] = i;
                break;
            }
        }
    } else if (delData.length == 1 && mask[delData[0]] != '_') {
        for (let i = input.selectionStart; i < mask.length; i++) {
            if (mask[i] == '_') {
                delData[0] = i;
                break;
            }
        }
    }
    if (delData.length) {
        start = delData[0];
        for (let i = 0; i < input.beforeData.value.length; i++) {
            if (delData.indexOf(i) == -1 && mask[i] == '_') {
                text.push(input.beforeData.value[i]);
            }
        }
    }
    input.value = value;
    text.forEach(function(el){
        if (pos != -1) {
            input.setSelectionRange(pos, ++pos);
            input.setRangeText(el);
            if (updateStart) {
                start = pos;
            }
        }
        pos = input.value.indexOf('_');
    });
    if (start !== null) {
        input.setSelectionRange(start, start);
    }
}

formsApp.prepareInputMask = function(input, mask, event){
    let value = input.value ? input.value : mask;
    if (event) {
        input.beforeData = {
            start: input.selectionStart,
            end: input.selectionEnd,
            value: value
        };
    } else {
        input.beforeData = {
            start: 0,
            end: 0,
            value: value
        };
        input.value = value;
    }
}

formsApp.executeMask = function(input, mask){
    let i = 0,
        flag = true,
        value = '';
    for (i = 0; i < input.value.length; i++) {
        flag = input.value[i] == mask[i] || mask[i] == '#' && /\d/.test(input.value[i])
        if (flag) {
            value += input.value[i];
        } else {
            break;
        }
    }
    if (!flag) {
        let subValue = input.value.substr(i),
            match = subValue.match(/\d+/),
            ind = 0;
        for (i; i < mask.length; i++) {
            if (mask[i] != '#') {
                value += mask[i];
            } else if (match && match[0][ind]) {
                value += match[0][ind++];
            } else {
                break;
            }
        }
        input.value = value;
    }
}

document.addEventListener('DOMContentLoaded', formsApp.createForms);
formsApp.setLanguage();
if (document.readyState == 'complete') {
    formsApp.createForms();
}