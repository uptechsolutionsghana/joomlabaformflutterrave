/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

var $f = jQuery,
    notification = uploadMode = null;

function showNotice(message, className)
{
    if (!className) {
        className = '';
    }
    if (notification.hasClass('notification-in')) {
        setTimeout(function(){
            notification.removeClass('notification-in').addClass('animation-out');
            setTimeout(function(){
                addNoticeText(message, className);
            }, 400);
        }, 2000);
    } else {
        addNoticeText(message, className);
    }
}

function addNoticeText(message, className)
{
    var time = 3000;
    if (className) {
        time = 6000;
    }
    notification.find('p').html(message);
    notification.addClass(className).removeClass('animation-out').addClass('notification-in');
    setTimeout(function(){
        notification.removeClass('notification-in').addClass('animation-out');
        setTimeout(function(){
            notification.removeClass(className);
        }, 400);
    }, time);
}

function strrev(string)
{
    var ret = '', i = 0;
    for (i = string.length - 1; i >= 0; i--) {
        ret += string[i];
    }

    return ret;
}

function renderPrice(value, thousand, separator, decimals)
{
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
        price = strrev(price);
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

function getUserLicense(data)
{
    $f.ajax({
        type:"POST",
        dataType:'text',
        url:"index.php?option=com_baforms&task=forms.getUserLicense",
        data:{
            data: data
        },
        success : function(msg){
            if (uploadMode != 'updateForms') {
                showNotice(formsLanguage['YOUR_LICENSE_ACTIVE']);
            }
            $f('#toolbar-about span[data-notification]').each(function(){
                this.dataset.notification = this.dataset.notification * 1 - 1;
            });
            $f('.forms-activate-license').hide();
            $f('.forms-deactivate-license').css('display', '');
        }
    });
}

function listenMessage(event)
{
    if (event.origin == 'https://www.balbooa.com') {
        try {
            let obj = JSON.parse(event.data);
            getUserLicense(obj.data);
            if (uploadMode == 'updateForms') {
                updateForms(formsApi.package);
            }
        } catch (error) {
            showNotice(event.data, 'ba-alert');
        }
        $f('#login-modal').modal('hide');
    }
}

function updateForms(package)
{
    setTimeout(function(){
        var str = formsLanguage['UPDATING']+'<img src="'+JUri;
        str += 'components/com_baforms/assets/images/reload.svg"></img>';
        notification[0].className = 'notification-in';
        notification.find('p').html(str);
    }, 400);
    var XHR = new XMLHttpRequest(),
        url = 'index.php?option=com_baforms&task=forms.updateForms&tmpl=component',
        data = {
            method: window.atob('YmFzZTY0X2RlY29kZQ=='),
            package: package
        };
    XHR.onreadystatechange = function(e) {
        if (XHR.readyState == 4) {
            setTimeout(function(){
                notification[0].className = 'animation-out';
                setTimeout(function(){
                    notification.find('p').html(formsLanguage['UPDATED']);
                    notification[0].className = 'notification-in';
                    setTimeout(function(){
                        notification[0].className = 'animation-out';
                        setTimeout(function(){
                            window.location.href = window.location.href;
                        }, 400);
                    }, 3000);
                }, 400);
            }, 2000);
        }
    };
    XHR.open("POST", url, true);
    XHR.send(JSON.stringify(data));
}

document.addEventListener('DOMContentLoaded', function(){

    var deleteMode;

    notification = $f('#ba-notification');

    $f('.ba-dashboard-apps-dialog').on('click', function(event){
        event.stopPropagation();
    });
    $f('body').on('click', function(event){
        $f('.ba-dashboard-apps-dialog.visible-dashboard-dialog').removeClass('visible-dashboard-dialog');
    });
    $f('body').on('click', '.ba-dashboard-popover-trigger', function(event){
        event.stopPropagation();
        let div = document.querySelector('.'+this.dataset.target),
            rect = this.getBoundingClientRect();
        div.classList.add('visible-dashboard-dialog');
        let left = (rect.left - div.offsetWidth / 2 + rect.width / 2),
            arrow = '50%';
        if (this.dataset.target == 'blog-settings-context-menu' && left < 110) {
            left = 110;
            arrow = (rect.left - 110 + rect.width / 2)+'px'
        }
        div.style.setProperty('--arrow-position', arrow);
        div.style.top = (rect.bottom + 10)+'px';
        div.style.left = left+'px';
    });

    Joomla.submitbutton = function(task){
        if (task == 'forms.export') {
            exportForms();
        } else if (task == 'submissions.export') {
            $f('input[type="radio"][name="export-submissions"]').prop('checked', false);
            $f('.apply-submissions-export').removeClass('active-button');
            $f('#export-dialog').modal();
        } else if (task == 'forms.trash' || task == 'forms.delete' || task == 'submissions.delete') {
            deleteMode = task;
            $f('#delete-dialog').modal();
        } else if (task == 'form.add') {
            window.location.href = JUri+'administrator/index.php?option=com_baforms&view=form&layout=create';
        } else if (task == 'form.edit') {
            $f('.select-td input[type="checkbox"]').each(function(){
                if (this.checked) {
                    window.location.href = JUri+'administrator/index.php?option=com_baforms&view=form&id='+this.value;
                    return false;
                }
            });
        } else {
            Joomla.submitform(task);
        }
    }

    Joomla.submitform = function(task)
    {
        document.adminForm.task.value = task;
        let xhr = new XMLHttpRequest(),
            url = document.adminForm.action,
            formData = new FormData(document.adminForm);
        xhr.onload = xhr.onerror = function(){
            let div = document.createElement('div');
            div.innerHTML = this.responseText;
            $f(div).find('#system-message-container .alert-message').each(function(){
                showNotice(this.textContent);
            });
            $f(div).find('#forms-content').each(function(){
                document.querySelector('#forms-content').innerHTML = this.innerHTML;
                loadPage();
            });
        }
        xhr.open("POST", url, true);
        xhr.send(formData);
    }

    function exportRequest(data, url)
    {
        $f.ajax({
            type: "POST",
            dataType: 'text',
            url: url,
            data: data,
            success: function(msg){
                var msg = JSON.parse(msg);
                if (msg.success) {
                    var iframe = $f('<iframe/>', {
                        name:'download-target',
                        id:'download-target',
                        src:'index.php?option=com_baforms&view=forms&task=forms.download&tmpl=component&file='+msg.message,
                        style:'display:none'
                    });
                    $f('#download-target').remove();
                    $f('body').append(iframe);
                }
            }
        });
    }

    function exportForms()
    {
        var exportId = new Array();
        $f('.table-striped tbody input[type="checkbox"]').each(function(){
            if ($f(this).prop('checked')) {
                var id = $f(this).val();
                exportId.push(id);
            }
        });
        exportId = exportId.join(';');
        let url = "index.php?option=com_baforms&view=forms&task=forms.exportForm",
            data = {
                export_id: exportId,
            }
        exportRequest(data, url);
    }

    function setTooltip(parent)
    {
        parent.off('mouseenter mouseleave').on('mouseenter', function(){
            if (this.closest('.ba-sidebar') && document.body.classList.contains('visible-sidebar')) {
                return false;
            }
            var coord = this.getBoundingClientRect(),
                top = coord.top,
                data = $f(this).find('.ba-tooltip').html(),
                center = (coord.right - coord.left) / 2,
                className = $f(this).find('.ba-tooltip')[0].className;
            center = coord.left + center;
            if ($f(this).find('.ba-tooltip').hasClass('ba-bottom')) {
                top = coord.bottom;
            }
            $f('body').append('<span class="'+className+'">'+data+'</span>');
            var tooltip = $f('body > .ba-tooltip').last(),
                width = tooltip.outerWidth(),
                height = tooltip.outerHeight();
            if (tooltip.hasClass('ba-top') || tooltip.hasClass('ba-help')) {
                top -= (15 + height);
                center -= (width / 2)
            } else if (tooltip.hasClass('ba-bottom')) {
                top += 10;
                center -= (width / 2)
            } else if (tooltip.hasClass('ba-right')) {
                center = coord.right + 10;
            }
            tooltip.css({
                'top' : top+'px',
                'left' : center+'px'
            });
        }).on('mouseleave', function(){
            var tooltip = $f('body > .ba-tooltip');
            tooltip.addClass('tooltip-hidden');
            setTimeout(function(){
                tooltip.remove();
            }, 500);
        });
    }

    function createAjax()
    {
        var form = document.getElementById('adminForm'),
            view = $f('[name="ba_view"]').val(),
            src = form.action,
            obj = {
                filter_search : $f('[name="filter_search"]').val(),
                filter_state : $f('[name="filter_state"]').val(),
                filter_order : $f('[name="filter_order"]').val(),
                filter_order_Dir : $f('[name="filter_order_Dir"]').val(),
                limit : $f('[name="limit"]').val()
            };
        view = view.split('&');
        obj['view'] = view[0];
        view = '&task=forms.setFilters';
        $f('body > .ba-tooltip').remove();
        $f.ajax({
            type : "POST",
            dataType : 'text',
            url : src+view,
            data : obj,
            success: function(msg){
                $f('#forms-container').load(src+' #forms-content', function(){
                    loadPage();
                });
            }
        });
    }

    function loadPage()
    {
        $f('.forms-options').on('click', function(event){
            event.preventDefault();
            event.stopPropagation();
        }).on('mouseenter', function(event){
            var coor = this.getBoundingClientRect();
            $f('div.options-context-menu').css({
                'left' : coor.right
            }).show();
        }).on('mouseleave', function(event){
            if (!(event.relatedTarget && (event.relatedTarget.classList.contains('options-context-menu')
                    || event.relatedTarget.closest('.options-context-menu')))) {
                $f('div.options-context-menu').hide();
            }
        });
        $f('div.options-context-menu').on('mouseleave', function(event){
            if (!(event.relatedTarget && (event.relatedTarget.classList.contains('forms-options')
                    || event.relatedTarget.closest('.forms-options')))) {
                $f('div.options-context-menu').hide();
            }
        });
        $f('.ba-custom-select > i, div.ba-custom-select input').on('click', function(event){
            var $this = $f(this),
                parent = $this.parent();
            if (!parent.find('ul').hasClass('visible-select')) {
                event.stopPropagation();
                $f('.visible-select').removeClass('visible-select');
                parent.find('ul').addClass('visible-select');
                parent.find('li').off('click').one('click', function(){
                    var text = this.textContent.trim(),
                        val = this.dataset.value;
                    parent.find('input[type="text"]').val(text);
                    parent.find('input[type="hidden"]').val(val).trigger('change');
                    parent.trigger('customAction');
                });
                parent.trigger('show');
                setTimeout(function(){
                    $f('body').one('click', function(){
                        $f('.visible-select').parent().trigger('customHide');
                        $f('.visible-select').removeClass('visible-select');
                    });
                }, 50);
            }
        });
        $f('div.ba-custom-select').on('show', function(){
            var $this = $f(this),
                ul = $this.find('ul'),
                value = $this.find('input[type="hidden"]').val();
            ul.find('i').remove();
            ul.find('.selected').removeClass('selected');
            ul.find('li[data-value="'+value+'"]').addClass('selected').prepend('<i class="zmdi zmdi-check"></i>');
        });
        $f('#filter-bar .ba-custom-select input[type="text"]').each(function(){
            this.size = this.value.length;
        });
        $f('#filter-bar .ba-custom-select').on('customAction', function(){
            var input = this.querySelector('input[type="text"]');
            input.size = input.value.length;
        });
        $f('#filter_search').on('keydown', function(event){
            if (event.keyCode == 13) {
                createAjax();
            }
        });
        $f('body div .ba-tooltip').each(function(){
            setTooltip($f(this).parent());
        });
        $f('span[data-sorting]').on('click', function(){
            var order = $f('[name="filter_order"]'),
                direction = $f('[name="filter_order_Dir"]'),
                dir = direction.val();
            if (order.val() == this.dataset.sorting) {
                dir = dir == 'asc' ? 'desc' : 'asc';
            }
            order.val(this.dataset.sorting);
            direction.val(dir);
            createAjax();
        });
        $f('div[class$="-filter"] [type="hidden"], #limit').on('change', function(event){
            if (this.dataset.name) {
                $f('input[name="'+this.dataset.name+'"]').val(this.value);
            }
            createAjax();
        });
        $f('.default-action').on('mousedown', function(event){
            if (event.button > 1) {
                return false;
            }
            event.stopPropagation();
            setTimeout(function(){
                $f(this).closest('div.ba-context-menu').hide();
            }, 150);
        });
        $f('#theme-import-trigger').on('click', function(){
            $f('#theme-import-file').trigger('click');
        });
        $f('#theme-import-file').on('change', function(){
            if (this.files.length > 0) {
                var array = this.files[0].name.split('.'),
                    n = array.length - 1,
                    ext = array[n];
                $f('.theme-import-trigger').val(this.files[0].name);
                if (ext != 'xml') {
                    showNotice(formsLanguage['UPLOAD_ERROR'], 'ba-alert');
                    $f('.apply-import').removeClass('active-button');
                } else {
                    $f('.apply-import').addClass('active-button');
                }
            }
        });
        $f('.apply-import').on('click', function(event){
            event.preventDefault();
            if (this.classList.contains('active-button')) {
                var installing = formsLanguage['INSTALLING'];
                installing += '<img src="'+JUri+'components/com_baforms/assets/images/reload.svg"></img>';
                notification[0].className = 'notification-in';
                notification.find('p').html(installing);
                $f('#import-dialog').modal('hide');
                Joomla.submitbutton('forms.importForms');
            }
        });
        $f('.submissions-list tbody tr').on('click', function(){
            let id = this.querySelector('.id-cell').textContent.trim(),
                title = this.querySelector('.submission-title').textContent.trim();
            $f('.active-submission').removeClass('active-submission');
            this.classList.add('active-submission');
            $f.ajax({
                type:"POST",
                dataType:'text',
                url:"index.php?option=com_baforms&task=submissions.showSubmission",
                data:{
                    id: id,
                },
                success: function(msg){
                    let obj = JSON.parse(msg),
                        data = obj.message.split('_-_'),
                        images = new Array('gif', 'jpg', 'jpeg', 'png', 'svg', 'webp'),
                        filesStr = '',
                        str = '<div class="submissions-sidebar-scroll-wrapper">';
                    str += '<div class="submission-info-wrapper">';
                    str += '<span class="submission-sidebar-title">'+title+'</span>';
                    str += '<span class="submission-sidebar-date">'+obj.time+'</span>';
                    str += '<div class="submission-data-wrapper">';
                    let uploadedFiles = {};
                    for (var i = 0; i < data.length; i++) {
                        let item = data[i].split('|-_-|');
                        if (item[2] == 'upload') {
                            if (item[1]) {
                                if (!uploadedFiles[item[0]]) {
                                    uploadedFiles[item[0]] = {
                                        files: new Array(),
                                        settings: '0_-_1_-_2_-_'+item[0]+';_-_'
                                    }
                                }
                                let array = item[1].split('/'),
                                    file = {
                                        form_id: 0,
                                        filename: item[1],
                                        name: array[array.length - 1],
                                        id: 0
                                    };
                                uploadedFiles[item[0]].files.push(file);
                            }
                        } else if (item[2] == 'total') {
                            let object = JSON.parse(item[1]),
                                template = document.querySelector('template.total-submission-pattern').content.cloneNode(true),
                                total = object.total * 1,
                                thousand = object.options.thousand,
                                separator = object.options.separator,
                                decimals = object.options.decimals,
                                subtotal = template.querySelector('.ba-cart-subtotal-row'),
                                shipping = template.querySelector('.ba-cart-shipping-row'),
                                discountRow = template.querySelector('.ba-cart-discount-row'),
                                taxRow = template.querySelector('.ba-cart-tax-row'),
                                totalRow = template.querySelector('.ba-cart-total-row'),
                                product = template.querySelector('.ba-form-product-row').cloneNode(true),
                                div = document.createElement('div'),
                                price = '',
                                tax = 0;
                            template.querySelector('.ba-form-product-row').remove();
                            if (object.options.position) {
                                template.querySelector('.ba-form-total-wrapper').classList.add('right-currency-position');
                            }
                            if (object.options.tax.enable) {
                                tax = total * object.options.tax.value / 100;
                                total += tax;
                            }
                            for (let ind in object.products) {
                                for (let i in object.products[ind]) {
                                    let row = product.cloneNode(true);
                                    price = renderPrice(String(object.products[ind][i].total), thousand, separator, decimals);
                                    row.querySelector('.ba-form-product-title-cell').textContent = object.products[ind][i].title;
                                    row.querySelector('.ba-form-product-quantity-cell').textContent = object.products[ind][i].quantity;
                                    row.querySelector('.field-price-currency').textContent = object.options.symbol;
                                    row.querySelector('.field-price-value').textContent = price;
                                    template.querySelector('.ba-form-products-cart').append(row);
                                }
                            }
                            if (!object.options.cart) {
                                template.querySelector('.ba-form-products-cart').remove();
                            }
                            if (object.shipping || object.promo || object.options.tax.enable) {
                                price = renderPrice(String(object.total), thousand, separator, decimals);
                                subtotal.querySelector('.field-price-currency').textContent = object.options.symbol;
                                subtotal.querySelector('.field-price-value').textContent = price;
                            } else {
                                subtotal.remove();
                            }
                            if (object.promo && object.promo == object.options.promo.code) {
                                discount = object.options.promo.discount * 1;
                                if (object.options.promo.unit == '%') {
                                    discount = total * discount / 100;
                                }
                                total -= discount;
                                price = renderPrice(String(discount), thousand, separator, decimals);
                                discountRow.querySelector('.field-price-currency').textContent = object.options.symbol;
                                discountRow.querySelector('.field-price-value').textContent = '-'+price;
                            } else {
                                discountRow.remove()
                            }
                            if (object.options.tax.enable) {
                                price = renderPrice(String(tax), thousand, separator, decimals);
                                taxRow.querySelector('.ba-cart-row-title').textContent = object.options.tax.title;
                                taxRow.querySelector('.field-price-currency').textContent = object.options.symbol;
                                taxRow.querySelector('.field-price-value').textContent = price;
                            } else {
                                taxRow.remove();
                            }
                            if (object.shipping) {
                                price = renderPrice(String(object.shipping.price), thousand, separator, decimals);
                                shipping.querySelector('.ba-form-shipping-title').textContent = object.shipping.title
                                shipping.querySelector('.field-price-currency').textContent = object.options.symbol;
                                shipping.querySelector('.field-price-value').textContent = price;
                                total += object.shipping.price * 1;
                            } else {
                                shipping.remove();
                            }
                            price = renderPrice(String(total), thousand, separator, decimals);
                            totalRow.querySelector('.field-price-currency').textContent = object.options.symbol;
                            totalRow.querySelector('.field-price-value').textContent = price;
                            div.append(template);
                            str += '<div class="submission-data-row">';
                            str += '<span class="submission-data-label">'+item[0]+'</span>'
                            str += '<div class="submission-data-message">'+div.innerHTML+'</div>';
                            str += '</div>';
                        } else if (item[1]) {
                            let message = item[1].replace(/<br>/, '');
                            str += '<div class="submission-data-row">';
                            str += '<span class="submission-data-label">'+item[0]+'</span>'
                            str += '<div class="submission-data-message">'+message+'</div>';
                            str += '</div>';
                        }
                    }
                    for (let ind in uploadedFiles) {
                        obj.files[ind] = uploadedFiles[ind];
                    }
                    for (let ind in obj.files) {
                        let field = obj.files[ind],
                            imageStr = fileStr = '',
                            settings = field.settings ? field.settings.split('_-_') : [0, 1, 2, 'Upload file button;'],
                            options = settings[3].split(';');
                        filesStr += '<div class="submissions-attachments-row">';
                        filesStr += '<span class="submission-data-label">'+options[0]+'</span>';
                        for (let i = 0; i < field.files.length; i++) {
                            let file = field.files[i],
                                path = JUri+uploads_storage+'/form-'+file.form_id+'/'+file.filename,
                                array = file.name.split('.'),
                                ext = array[array.length - 1].toLowerCase(),
                                type = images.indexOf(ext) == -1 ? 'file' : 'image';
                            if (file.id == 0) {
                                path = JUri+uploaded_path+'/baforms/'+file.filename;
                            }
                            if (type == 'file') {
                                fileStr += '<span class="submission-'+type+'-wrapper">'+
                                    '<span class="submission-'+type+'-type">'+
                                    '<i class="zmdi zmdi-attachment-alt"></i>'+
                                    '</span><a target="_blank" href="'+path+'">'+file.name+'</a>'+
                                    '<span class="submission-attachment-icons-wrapper">'+
                                    '<a download href="'+path+'"><i class="zmdi zmdi-download"></i></a>'+
                                    '<i class="zmdi zmdi-delete delete-comment-attachment-file" data-id="'+file.id+
                                    '" data-filename="'+file.filename+'" data-submission="'+id+'" data-type="'+type+'"></i>'+
                                    '</span></span>';
                            } else {
                                imageStr += '<span class="submission-'+type+'-wrapper">'+
                                    '<span class="submission-'+type+'-type" style="background-image: url('+path+
                                    ')" data-img="'+path+'"></span>'+
                                    '<i class="zmdi zmdi-close delete-comment-attachment-file" data-id="'+file.id+
                                    '" data-filename="'+file.filename+'" data-submission="'+id+'" data-type="'+type+'"></i></span>';
                            }
                        }
                        if (imageStr) {
                            filesStr += '<div class="submissions-image-wrapper">'+imageStr+'</div>';
                        }
                        if (fileStr) {
                            filesStr += '<div class="submissions-file-wrapper">'+fileStr+'</div>';
                        }
                        filesStr += '</div>'
                    }
                    if (filesStr) {
                        str += '<div class="submissions-attachments-wrapper">'+filesStr+'</div>';
                    }
                    str += '</div></div></div>';
                    document.querySelector('.submissions-sidebar-body').innerHTML = str;
                    $f('.submissions-sidebar-header .disabled').removeClass('disabled');
                    $f('.submissions-sidebar-header').find('.save-pdf-submission, .print-submission').attr('data-id', obj.id);
                }
            });
        });
        $f('.print-submission').on('click', function(){
            if (!this.classList.contains('disabled')) {
                let url = window.location.href+'&layout=print&tmpl=component&id='+this.dataset.id;
                window.open(url,'print','width=700,height=480');
            }
        });
        $f('.save-pdf-submission').on('click', function(){
            if (!this.classList.contains('disabled')) {
                let url = window.location.href+'&layout=pdf&tmpl=component&id='+this.dataset.id,
                    iframe = document.createElement('iframe');
                iframe.className = 'pdf-print-iframe';
                document.body.appendChild(iframe);
                iframe.src = url;
            }
        });

        let alert = document.querySelector('.alert-message');
        if (alert) {
            showNotice(alert.textContent);
            alert.remove();
        }
    }

    function setCommentsImage(image)
    {
        var imgHeight = image.naturalHeight,
            imgWidth = image.naturalWidth,
            modal = $f('.ba-image-modal.instagram-modal').removeClass('instagram-fade-animation'),
            wWidth = $f(window).width(),
            wHeigth = $f(window).height(),
            percent = imgWidth / imgHeight;
        if (wWidth > 1024) {
            if (imgWidth < wWidth && imgHeight < wHeigth) {
            
            } else {
                if (imgWidth > imgHeight) {
                    imgWidth = wWidth - 100;
                    imgHeight = imgWidth / percent;
                } else {
                    imgHeight = wHeigth - 100;
                    imgWidth = percent * imgHeight;
                }
                if (imgHeight > wHeigth) {
                    imgHeight = wHeigth - 100;
                    imgWidth = percent * imgHeight;
                }
                if (imgWidth > wWidth) {
                    imgWidth = wWidth - 100;
                    imgHeight = imgWidth / percent;
                }
            }
        } else {
            percent = imgWidth / imgHeight;
            if (percent >= 1) {
                imgWidth = wWidth * 0.90;
                imgHeight = imgWidth / percent;
                if (wHeigth - imgHeight < wHeigth * 0.1) {
                    imgHeight = wHeigth * 0.90;
                    imgWidth = imgHeight * percent;
                }
            } else {
                imgHeight = wHeigth * 0.90;
                imgWidth = imgHeight * percent;
                if (wWidth - imgWidth < wWidth * 0.1) {
                    imgWidth = wWidth * 0.90;
                    imgHeight = imgWidth / percent;
                }
            }
        }
        var modalTop = (wHeigth - imgHeight) / 2,
            left = (wWidth - imgWidth) / 2;
        setTimeout(function(){
            modal.find('> div').css({
                'width' : Math.round(imgWidth),
                'height' : Math.round(imgHeight),
                'left' : Math.round(left),
                'top' : Math.round(modalTop)
            }).addClass('instagram-fade-animation');
        }, 1);
    }

    function commentsImageGetPrev(img, images, index)
    {
        var ind = images[index - 1] ? index - 1 : images.length - 1;
        image = document.createElement('img');
        image.onload = function(){
            setCommentsImage(this);
        }
        image.src = images[ind].dataset.img;
        img.style.backgroundImage = 'url('+image.src+')';

        return ind;
    }

    function commentsImageGetNext(img, images, index)
    {
        var ind = images[index + 1] ? index + 1 : 0;
        image = document.createElement('img');
        image.onload = function(){
            setCommentsImage(this);
        }
        image.src = images[ind].dataset.img;
        img.style.backgroundImage = 'url('+image.src+')';

        return ind;
    }

    function commentsImageModalClose(modal, images, index)
    {
        $f(window).off('keyup.instagram');
        modal.addClass('image-lightbox-out');
        var $image = $f(images[index]), 
            width = $image.width(),
            height = $image.height(),
            offset = $image.offset();
        modal.find('> div').css({
            'width' : width,
            'height' : height,
            'left' : offset.left,
            'top' : offset.top - $f(window).scrollTop()
        });
        setTimeout(function(){
            modal.remove();
        }, 500);
    }

    $f('body').on('click.lightbox', '.submission-image-type', function(){
        var wrapper = $f(this).closest('.submissions-image-wrapper'),
            div = document.createElement('div'),
            index = 0,
            $this = this,
            endCoords = startCoords = {},
            image = document.createElement('img'),
            images = new Array(),
            width = this.offsetWidth,
            height = this.offsetHeight,
            offset = $f(this).offset(),
            modal = $f(div),
            img = document.createElement('div');
        img.style.backgroundImage = 'url('+this.dataset.img+')';
        div.className = 'ba-image-modal instagram-modal ba-comments-image-modal';
        img.style.top = (offset.top - $f(window).scrollTop())+'px';
        img.style.left = offset.left+'px';
        img.style.width = width+'px';
        img.style.height = height+'px';
        div.appendChild(img);
        modal.on('click', function(){
            commentsImageModalClose(modal, images, index)
        });
        $f('body').append(div);
        image.onload = function(){
            setCommentsImage(this);
        }
        image.src = this.dataset.img;
        setTimeout(function(){
            var str = '';
            if (wrapper.find('.submission-image-type').length > 1) {
                str += '<i class="zmdi zmdi-chevron-left"></i><i class="zmdi zmdi-chevron-right"></i>';
            }
            str += '<i class="zmdi zmdi-close">';
            modal.append(str);
            modal.find('.zmdi-chevron-left').on('click', function(event){
                event.stopPropagation();
                index = commentsImageGetPrev(img, images, index);
            });
            modal.find('.zmdi-chevron-right').on('click', function(event){
                event.stopPropagation();
                index = commentsImageGetNext(img, images, index);
            });
            modal.find('.zmdi-close').on('click', function(event){
                event.stopPropagation();
                commentsImageModalClose(modal, images, index)
            });
        }, 600);
        wrapper.find('.submission-image-type').each(function(ind){
            images.push(this);
            if (this == $this) {
                index = ind;
            }
        });
        $f(window).on('keyup.instagram', function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.keyCode === 37) {
                index = commentsImageGetPrev(img, images, index);
            } else if (event.keyCode === 39) {
                index = commentsImageGetNext(img, images, index);
            } else if (event.keyCode === 27) {
                commentsImageModalClose(modal, images, index)
            }
        });
    });

    notification.find('.zmdi.zmdi-close').on('click', function(){
        notification.removeClass('notification-in').addClass('animation-out');
    });
    $f('body').on('mousedown', function(){
        $f('.context-active').removeClass('context-active');
        $f('.ba-context-menu').hide();
    });
    $f('#apply-delete').on('click', function(event){
        event.preventDefault();
        $f('#delete-dialog').modal('hide');
        Joomla.submitform(deleteMode);
    });
    $f('.import-forms').on('mousedown', function(){
        $f('#import-dialog').modal();
    });
    $f('.export-forms').on('mousedown', function(){
        let url = "index.php?option=com_baforms&view=forms&task=forms.exportForms",
            data = {};
        exportRequest(data, url);
    });
    $f('#toolbar-language button').on('click', function(){
        $f('#languages-dialog').modal();
    });
    $f('#toolbar-about').find('button').on('click', function(){
        $f('#about-dialog').modal();
    });
    $f('#languages-dialog .languages-wrapper').on('click', 'span.language-title', function(){
        $f('#languages-dialog').modal('hide');
        var installing = formsLanguage['INSTALLING']+'<img src="'+JUri+'components/com_baforms/assets/images/reload.svg"></img>';
        notification[0].className = 'notification-in';
        notification.find('p').html(installing);
        $f.ajax({
            type:"POST",
            dataType:'text',
            url:"index.php?option=com_baforms&task=forms.addLanguage",
            data:{
                method: window.atob('YmFzZTY0X2RlY29kZQ=='),
                url: formsApi.languages[this.dataset.key].url,
                zip: formsApi.languages[this.dataset.key].zip,
            },
            error: function(msg){
                console.info(msg.responseText)
            },
            success: function(msg){
                showNotice(msg);
            }
        });
    });
    $f('#apply-deactivate').on('click', function(event){
        event.preventDefault();
        $f.ajax({
            type:"POST",
            dataType:'text',
            url:"index.php?option=com_baforms&task=forms.checkFormsState",
            success: function(msg){
                var obj = JSON.parse(msg),
                    url = 'https://www.balbooa.com/demo/index.php?',
                    script = document.createElement('script');
                url += 'option=com_baupdater&task=baforms.deactivateLicense';
                url += '&data='+obj.data;
                url += '&time='+(+(new Date()));
                script.onload = function(){
                    $f.ajax({
                        type : "POST",
                        dataType : 'text',
                        url : JUri+"index.php?option=com_baforms&task=form.setAppLicense",
                        success: function(msg){
                            showNotice(formsLanguage['SUCCESSFULY_DEACTIVATED']);
                            $f('#toolbar-about span[data-notification]').each(function(){
                                this.dataset.notification = this.dataset.notification * 1 + 1;
                            });
                            $f('.forms-activate-license').css('display', '');
                            $f('.forms-deactivate-license').hide();
                        }
                    });
                }
                script.src = url;
                document.head.appendChild(script);
            }
        });
        $f('#deactivate-dialog').modal('hide');
    });
    $f('.activate-link').on('click', function(event){
        event.preventDefault();
        $f('.ba-dashboard-about.visible-dashboard-dialog').removeClass('visible-dashboard-dialog');
        uploadMode = 'activateForms';
        $f('#login-modal').modal();
    });
    $f('.deactivate-link').on('click', function(event){
        event.preventDefault();
        $f('.ba-dashboard-about.visible-dashboard-dialog').removeClass('visible-dashboard-dialog');
        $f('#deactivate-dialog').modal();
    });
    $f('.forms-update-wrapper').on('click', '.update-link', function(event){
        event.preventDefault();
        $f('.ba-dashboard-about.visible-dashboard-dialog').removeClass('visible-dashboard-dialog');
        $f.ajax({
            type:"POST",
            dataType:'text',
            url:"index.php?option=com_baforms&task=forms.checkFormsState",
            success: function(msg){
                var flag = true,
                    obj;
                if (msg) {
                    obj = JSON.parse(msg);
                    flag = !obj.data;
                }
                if (flag) {
                    uploadMode = 'updateForms';
                    $f('#login-modal').modal();
                } else {
                    var url = 'https://www.balbooa.com/demo/index.php?',
                        domain = window.location.host.replace('www.', ''),
                        script = document.createElement('script');
                    domain += window.location.pathname.replace('index.php', '').replace('/administrator', '');
                    url += 'option=com_baupdater&task=baforms.checkFormsUser';
                    url += '&data='+obj.data;
                    if (domain[domain.length - 1] != '/') {
                        domain += '/';
                    }
                    url += '&domain='+window.btoa(domain);
                    script.onload = function(){
                        if (formsResponse) {
                            updateForms(formsApi.package);
                        } else {
                            uploadMode = 'updateForms';
                            $f('#login-modal').modal();
                        }
                    }
                    script.src = url;
                    document.head.appendChild(script);
                }
            }
        });
    });
    $f('#login-modal').on('show', function(){
        var url = 'https://www.balbooa.com/demo/index.php?option=com_baupdater&view=baforms',
            domain = window.location.host.replace('www.', '');
            iframe = document.createElement('iframe');
        domain += window.location.pathname.replace('index.php', '').replace('/administrator', '');
        if (domain[domain.length - 1] != '/') {
            domain += '/';
        }
        url += '&domain='+window.btoa(domain);
        iframe.onload = function(){
            this.classList.add('iframe-loaded');
        }
        iframe.src = url;
        $f('#login-modal .modal-body').html(iframe);
        window.addEventListener("message", listenMessage, false);
    });
    $f('#login-modal').on('hide', function(){
        window.removeEventListener("message", listenMessage, false);
    });





    $f('body').on('click', '.ba-submission-unread', function(){
        this.classList.remove('ba-submission-unread');
        let id = this.querySelector('input[type="checkbox"]').value;
        $f('.unread-submissions-count').each(function(){
            let count = this.textContent - 1;
            if (count) {
                this.textContent = count;
            } else {
                this.remove();
            }
        });
        $f.ajax({
            type : "POST",
            dataType : 'text',
            url : "index.php?option=com_baforms&task=submissions.setReadStatus",
            data: {
                id: id
            }
        });
    });
    $f('input[type="radio"][name="export-submissions"]').on('change', function(){
        $f('.apply-submissions-export').addClass('active-button');
    });
    $f('.apply-submissions-export').on('click', function(event){
        event.preventDefault();
        if (this.classList.contains('active-button')) {
            let task = 'CSV',
                exportData = new Array(),
                exportStr = '';
            $f('input[type="radio"][name="export-submissions"]').each(function(){
                if (this.checked) {
                    task = this.value;
                    return false;
                }
            });
            $f('.submissions-list tbody input[type="checkbox"]').each(function(){
                if (this.checked) {
                    var form = $f(this).closest('tr').find('.submission-title').text().trim(),
                        id = $f(this).closest('tr').find('.id-cell').text().trim(),
                        data = {};
                    data.form = form;
                    data.id = id;
                    data = JSON.stringify(data);
                    exportData.push(data);
                }
            });
            exportStr = exportData.join('|__|');
            $f.ajax({
                type:"POST",
                dataType:'text',
                url:"index.php?option=com_baforms&view=submissions&task=submissions.export"+task,
                data:{
                    exportData: exportStr,
                },
                success: function(msg){
                    var msg = JSON.parse(msg);
                    if (msg.success) {
                        var iframe = $f('<iframe/>', {
                            name:'form-target',
                            id:'form-target',
                            src:'index.php?option=com_baforms&view=submissions&task=submissions.download&file='+msg.message,
                            style:'display:none'
                        });
                        $f('#form-target').remove();
                        $f('body').append(iframe);
                        
                    }
                }
            });
            $f('#export-dialog').modal('hide');
        }
    });
    $f('body').on('click', '.delete-comment-attachment-file', function(){
        let $this = this,
            data = {
                id: this.dataset.id,
                filename: this.dataset.filename,
                submission: this.dataset.submission
            };
        $f.ajax({
            type : "POST",
            dataType : 'text',
            url : "index.php?option=com_baforms&task=submissions.removeTmpAttachment",
            data: data,
            complete:function(msg){
                let wrapper = $f($this).closest('.submissions-attachments-row'),
                    parent = $f($this).closest('.submissions-'+$this.dataset.type+'-wrapper');
                $this.closest('.submission-'+$this.dataset.type+'-wrapper').remove();
                if (parent.find('.submission-image-wrapper, .submission-file-wrapper').length == 0) {
                    parent.remove();
                }
                if (wrapper.find('.submission-image-wrapper, .submission-file-wrapper').length == 0) {
                    wrapper.remove();
                }
            }
        });
    });

    $f('.modal').on('hide', function(){
        $f(this).addClass('ba-modal-close').data('modal').$backdrop.addClass('ba-backdrop-close');
        setTimeout(function(){
            $f('.ba-modal-close').removeClass('ba-modal-close');
        }, 500);
    });



    loadPage();
});

document.addEventListener('DOMContentLoaded', function(){
    let script = document.createElement('script');
    script.onload = function(){
        $f.ajax({
            type : "POST",
            dataType : 'text',
            url : 'index.php?option=com_baforms&task=forms.versionCompare',
            data : {
                version: formsApi.version
            },
            success: function(msg){
                if (msg == -1) {
                    $f('#toolbar-about').each(function(){
                        let coord = this.getBoundingClientRect(),
                            center = coord.left + ((coord.right - coord.left) / 2),
                            html = '<span class="update-available-tooltip"><i class="zmdi zmdi-alert-triangle"></i>'+
                            formsLanguage['UPDATE_AVAILABLE']+'</span>';
                        $f('body').append(html);
                        var tooltip = $f('.update-available-tooltip'),
                            width = tooltip.outerWidth();
                        center -= (width / 2);
                        tooltip.css({
                            'left' : center+'px'
                        });
                    });
                    $f('.forms-update-wrapper').each(function(){
                        this.classList.add('forms-update-available');
                        this.querySelector('i').className = 'zmdi zmdi-alert-triangle';
                        this.querySelector('span').textContent = formsLanguage['UPDATE_AVAILABLE'];
                        let a = document.createElement('a');
                        a.className = 'update-link dashboard-link-action';
                        a.href = "#";
                        a.textContent = formsLanguage['UPDATE'];
                        this.appendChild(a);
                    });
                }
            }
        });
        formsApi.languages.forEach(function(el, ind){
            var str = '<div class="language-line"><span class="language-img"><img src="'+el.flag+'">';
            str += '</span><span class="language-title" data-key="'+ind+'">'+el.title;
            str += '</span><span class="language-code">'+el.code+'</span></div>';
            $f('#languages-dialog .languages-wrapper').append(str);
        });
    }
    script.type = 'text/javascript';
    script.src = 'https://www.balbooa.com/updates/baforms/formsApi/formsApi.js';
    document.head.appendChild(script);
});