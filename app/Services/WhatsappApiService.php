<?php

namespace App\Services;

use App\Models\Company;
use App\Models\MessageSetting;

use Auth;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;


trait WhatsappApiService
{
	
	// issue register confirmation message

    // to send  service request, service completed, and ready for delivery  messages


  	public function sendServiceMessages($data) 
  	{	
        $company=Company::first();
        $mset=MessageSetting::where('status',1)->first();
        if(!empty($mset))
        {
            $endpoint = $mset->whatsapp_api;
            $client = new \GuzzleHttp\Client();

                    $params=[
                        "apiToken"=>$mset->api_token,
                        "phone_number_id"=>"831712883355702",
                        "template_id"=>$data['template_id'],
                        "templateVariable-serviceId-1"=>$data['tracking_id'],
                        "templateVariable-branchContactMobile-2"=>$company->customer_care_number??"-",
                        "phone_number"=>$data['user_mobile'] 
                    ];

            $response = $client->request('GET', $endpoint, ['query' => $params]);
            $statusCode = $response->getStatusCode();
            //$content = $response->getBody()->getContents();
            $content=json_decode($response->getBody()->getContents(), true);

		    return $content;
        }
        else
        {
            return false;
        }
	}



}
