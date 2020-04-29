<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

class Flutterwave
{
    private $_api_key;
    private $_sec_key;
    private $_enc_key;
    private $_payload;
    private $_env;

    public function __construct($api_key, $secret_key, $encryption_key, $environment)
    {
        $this->_api_key = $api_key;
        $this->_sec_key = $secret_key;
        $this->_enc_key = $encryption_key;
        $this->_env = $environment;
    }

    public function getKey($seckey)
    {
        $hashedkey = md5($seckey);
        $hashedkeylast12 = substr($hashedkey, -12);
        $seckeyadjusted = str_replace("FLWSECK-", "", $seckey);
        $seckeyadjustedfirst12 = substr($seckeyadjusted, 0, 12);
        $encryptionkey = $seckeyadjustedfirst12.$hashedkeylast12;
        return $encryptionkey;
    }
      
      
      
    public function encrypt3Des($data, $key)
    {
        $encData = openssl_encrypt($data, 'DES-EDE3', $key, OPENSSL_RAW_DATA);
        return base64_encode($encData);
    }

    public function set_payload($params)
    {
        $this->_payload = $params;
        $this->_payload['PBFPubKey'] = $this->_api_key;
        $this->_payload = json_encode($this->_payload);
    }

    public function pay(){
        $enc_key = $this->getKey($this->_sec_key);
        $post_enc = $this->encrypt3Des($this->_payload, $enc_key);
        $postData = [
            'PBFPubKey'=> $this->_api_key,
            'client'=> $post_enc,
            'alg'=> '3DES-24'
        ];

        // print_r("Tester");

        $ch = curl_init();
    
        curl_setopt($ch, CURLOPT_URL, $this->_env . "/flwv3-pug/getpaidx/api/charge");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData)); //Post Fields
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 200);
        curl_setopt($ch, CURLOPT_TIMEOUT, 200);
                
        $headers = array('Content-Type: application/json');
        
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        $request = curl_exec($ch);
        header("Content-type: application/json");
        print $request->data;
    }

}
