/**
* @package   Gridbox
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

!function ($) {
    var dragEl,
        sortGroups = {},
        sortable = function (element, options) {
            this.delete = function(){
                var item = $(element);
                item.off('mousedown.sortable')
            };
            this.init = function(){
                var item = $(element);
                if (!sortGroups[options.group]) {
                    sortGroups[options.group] = new Array();
                }
                sortGroups[options.group].unshift(item);
                item.on('mousedown.sortable', options.handle, function(event){
                    if (event.button == 0 && !event.target.classList.contains('cancel-sortable')
                        && !event.target.closest('.cancel-sortable')) {
                        options.start(item[0]);
                        dragEl = $(this).closest(element.children)[0];
                        var rectangle = dragEl.getBoundingClientRect(),
                            comp = getComputedStyle(dragEl),
                            target = null,
                            method = null,
                            obj = {
                                width: rectangle.right - rectangle.left,
                                display: 'block',
                                left: rectangle.left,
                                top: rectangle.top - comp.marginTop.replace('px', '') * 1
                            };
                        options.helper[0].className = dragEl.className+' sortable-helper';
                        options.helper.css({
                            top : event.clientY+'px',
                            display: 'block',
                            left : event.clientX+'px',
                        });
                        options.placeholder.css(obj);
                        options.backdrop.css({
                            display: 'block'
                        });
                        document.body.classList.add(options.group+'-sortable-started');
                        $(dragEl).attr('style', 'display: none !important;').addClass('element-in-sorting');
                        $(document).on('mousemove.sortable', function(event){
                            options.helper.css({
                                'top' : event.clientY+'px',
                                'left' : event.clientX+'px',
                            });
                            var array = sortGroups[options.group];
                            target = null;
                            for (var i = 0; i < array.length; i++) {
                                var rect = null;
                                array[i].find(options.selector).each(function(){
                                    rect = this.getBoundingClientRect();
                                    comp = getComputedStyle(this);
                                    var object = {
                                            top : rect.top - comp.marginTop.replace('px', '') * 1,
                                            bottom : rect.bottom + comp.marginBottom.replace('px', '') * 1,
                                            left : rect.left,
                                            right: rect.right
                                        };
                                    rect = object;
                                    if (rect.top < event.clientY && rect.bottom > event.clientY &&
                                        rect.left < event.clientX && event.clientX < rect.right) {
                                        target = this;
                                        return false;
                                    }
                                });
                                if (target) {
                                    var next = (event.clientY - rect.top) / (rect.bottom - rect.top) > .5;
                                    if (next) {
                                        options.placeholder.css({
                                            width: rect.right - rect.left,
                                            left: rect.left,
                                            top: rect.bottom
                                        });
                                        method = 'after';
                                    } else {
                                        options.placeholder.css({
                                            width: rect.right - rect.left,
                                            left: rect.left,
                                            top: rect.top
                                        });
                                        method = 'before';
                                    }
                                } else {
                                    var rect = array[i][0].getBoundingClientRect(),
                                        length = $(array[i][0]).find(options.selector).not(dragEl).length;
                                    if (rect.top < event.clientY && rect.bottom > event.clientY &&
                                        rect.left < event.clientX && event.clientX < rect.right && length == 0) {
                                        target = array[i][0];
                                    }
                                    if (target && !target.classList.contains('ba-form-column')) {
                                        var targetW = rect.right - rect.left,
                                            targetL = rect.left,
                                            targetT = rect.bottom
                                        method = 'append';
                                        options.placeholder.css({
                                            width: targetW,
                                            left: targetL,
                                            top: targetT
                                        });
                                    } else if (target) {
                                        target = $(target).find('> .empty-item')[0];
                                        method = 'before';
                                        options.placeholder.css({
                                            width: rect.right - rect.left,
                                            left: rect.left,
                                            top: rect.top
                                        });
                                    }
                                }
                                if (target) {
                                    break;
                                }
                            }
                            if (!target) {
                                options.placeholder.css(obj)
                            }
                            return false;
                        }).off('mouseleave.sortable').on('mouseleave.sortable', function(){
                            $(document).trigger('mouseup.sortable');
                        }).off('mouseup.sortable').on('mouseup.sortable', function(){
                            if (target) {
                                $(target)[method](dragEl);
                            }
                            $(dragEl).attr('style', '').removeClass('element-in-sorting');
                            target = null;
                            options.helper.css('display', 'none');
                            options.placeholder.css('display', 'none');
                            options.backdrop.css('display', 'none');
                            document.body.classList.remove(options.group+'-sortable-started');
                            $(document).off('mousemove.sortable mouseup.sortable mouseleave.sortable');
                            options.change(dragEl);
                        });
                        return false;
                    }
                });
            }
        }

    $.fn.sortable = function(option) {
        return this.each(function() {
            var $this = $(this),
                data = $this.data('sortable'),
                options = $.extend({}, $.fn.sortable.defaults, typeof option == 'object' && option);
            if (data) {
                data.delete();
                $this.removeData();
            }
            $this.data('sortable', (data = new sortable(this, options)));
            data.init();
        });
    }

    $.fn.sortable.defaults = {
        'selector' : '> *',
        change : function(){
            
        },
        start : function(){

        }
    }
    
    $.fn.sortable.Constructor = sortable;
}(window.$f ? window.$f : window.jQuery);

document.addEventListener('DOMContentLoaded', function(){
    if (!document.querySelector('.sortable-helper')) {
        document.body.insertAdjacentHTML('beforeEnd', '<div class="sortable-helper"><i class="zmdi zmdi-apps"></i></div>');
    }
    if (!document.querySelector('.sortable-placeholder')) {
        document.body.insertAdjacentHTML('beforeEnd', '<div class="sortable-placeholder"><div></div></div>');
    }
    if (!document.querySelector('.sortable-backdrop')) {
        document.body.insertAdjacentHTML('beforeEnd', '<div class="sortable-backdrop"><div></div></div>');
    }
    $f.fn.sortable.defaults.helper = $f('.sortable-helper');
    $f.fn.sortable.defaults.placeholder = $f('.sortable-placeholder');
    $f.fn.sortable.defaults.backdrop = $f('.sortable-backdrop');
});