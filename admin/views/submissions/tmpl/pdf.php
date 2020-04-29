<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

JHtml::_('behavior.tooltip');
$print = explode('_-_', $this->submission->message);
?>
<link rel="stylesheet" href="components/com_baforms/assets/css/ba-admin.css" type="text/css"/>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.5/jspdf.min.js"></script>
<script type="text/javascript">
var $ = jQuery;
document.addEventListener('DOMContentLoaded', function(){
    var quotes = document.getElementById('pdf-wrapper');
    html2canvas(quotes, {
        onrendered: function(canvas) {
            var pdf = new jsPDF('p', 'pt', 'letter');
            for (var i = 0; i <= quotes.clientHeight / 1130; i++) {
                var onePageCanvas = document.createElement("canvas"),
                    ctx = onePageCanvas.getContext('2d'),
                    dHeight = 1130;
                if (quotes.clientHeight - 1130 * i < 1130) {
                    dHeight = quotes.clientHeight - 1130 * i;
                }
                onePageCanvas.setAttribute('width', 900);
                onePageCanvas.setAttribute('height', dHeight);
                ctx.drawImage(canvas, 0, 1130 * i, 900, dHeight, 0, 0, 900, dHeight);
                var canvasDataURL = onePageCanvas.toDataURL("image/jpeg", 1.0),
                    width = onePageCanvas.width,
                    height = onePageCanvas.clientHeight;
                if (i > 0) {
                    pdf.addPage(612, 791);
                }
                pdf.setPage(i+1);
                pdf.addImage(canvasDataURL, 'jpeg', 20, 40, (width*.62), (height*.62));
            }
            pdf.save('baforms.pdf');
        }
    });
});
</script>
<div id="editor"></div>
<div id="pdf-wrapper" style="background: #ffffff; padding: 25px; ">
    <div style="display: flex; justify-content: space-between;margin-right: 100%;align-items: center;width: 850px;">
        <h1 style="padding: 25px 0; font: 700 18px/32px 'Roboto', sans-serif;"><?php echo $this->submission->title; ?></h1><br>
        <p style="font-size: 14px;"><?php echo date('Y-m-d', strtotime($this->submission->date_time)); ?></p>
    </div>
    <div class="row-fluid">
        <div style="width: 850px;">
            <table id="submission-data" class="table table-striped">
<?php
        foreach ($print as $message) {
            $message = explode('|-_-|', $message);
            if (!empty($message) && isset($message[2])) {
?>
                <tr>
                    <td style="font-size: 16px;background: transparent;border: none;padding-top: 25px;line-height: 32px;padding: 25px 0 0;"><b><?php echo $message[0]; ?>:</b></td>
                </tr>
                <tr>
                    <td style="background: transparent;border: none;padding: 0;">
<?php
                    if ($message[2] == 'total') {
                        $object = json_decode($message[1]);
                        include(JPATH_COMPONENT.'/views/layout/pdf-total-submission.php');
                    } else if ($message[2] != 'upload') {
                        $message[1] = preg_replace('/<br>/', '', $message[1], 1);
?>
                        <p style="color: #999;"><?php echo $message[1]; ?></p>
<?php
                    } else if (!empty($message[1])) {
?>
                        <a target="_blank" href="<?php echo JUri::root().$this->uploaded_path; ?>/baforms/<?php echo $message[1]; ?>">
                            View Uploaded File
                        </a>
<?php
                    }
?>
                    </td>
                </tr>
<?php
            }
        }
?>
            </table>
        </div>
    </div>
</div>