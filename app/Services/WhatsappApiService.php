<?php

namespace App\Services;

use App\Models\Company;
use App\Models\MessageSetting;

use App\Jobs\SendWhatsAppMessageJob;
use Log;

trait WhatsappApiService
{
	
	// issue register confirmation message

    // to send  service request, service completed, and ready for delivery  messages


    public function sendServiceMessages($data)
    {

        try
        {
            $company=Company::first();
            $mset=MessageSetting::where('status',1)->first();
            if(!empty($mset))
            {
                $data['endpoint'] = $mset->whatsapp_api;
                $data['api_token']=$mset->api_token;
                $data['phone_number_id']=$mset->phone_number_id;
                $data['customer_care']=$company->customer_care_number??"-";

                SendWhatsAppMessageJob::dispatch($data);

            }
            else
            {
                \Log::info("Api details not found in message_settings table.!");
            }
        }
        catch(\Exception $e)
        {
            \Log::info($e->getMessage());
        }

    }


}
