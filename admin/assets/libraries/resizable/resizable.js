/**
* @package   Gridbox
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

!function ($) {
	var resizable = function (element, options) {
        this.init = function(){
            var item = $(element),
                handle = item.find(options.handle);
            handle.on('mousedown.resizable', function(event){
                if (event.button == 0) {
                    event.stopPropagation();
                    $('.draggable-backdrop').addClass('draggable-started');
                    var x = event.clientX,
                        y = event.clientY,
                        width = item.width(),
                        height = item.height();
                    item.css({
                        'transition' : 'none'
                    }).addClass('resizable-started');
                    $(document).on('mousemove.resizable', function(event){
                        var deltaX = x -event.clientX,
                            deltaY = y - event.clientY;
                        if (deltaY > 0) {
                            height -= Math.abs(deltaY);
                        } else {
                            height += Math.abs(deltaY);
                        }
                        if (options.direction == 'right') {
                            if (deltaX < 0) {
                                width += Math.abs(deltaX);
                            } else {
                                width -= Math.abs(deltaX);
                            }
                        }
                        item.css({
                            'width' : width+'px',
                            'height' : height+'px'
                        });
                        x = event.clientX;
                        y = event.clientY;
                        options.change();
                        return false;
                    }).on('mouseup.resizable', function(){
                        item.removeClass('resizable-started');
                        $('.draggable-backdrop').removeClass('draggable-started');
                        $(document).off('mousemove.resizable mouseup.resizable');
                    });
                    return false;
                }
            });
        }
    }

    $.fn.resizable = function (option) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('resizable'),
                options = $.extend({}, $.fn.resizable.defaults, typeof option == 'object' && option);
            if (!data) {
                $this.data('resizable', (data = new resizable(this, options)));
            }
            data.init();
        });
    }

    $.fn.resizable.defaults = {
        direction : 'right',
        change : function(){
            
        }
    }
    
    $.fn.resizable.Constructor = resizable;
}(window.$f ? window.$f : window.jQuery);