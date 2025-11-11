<?php

namespace App\Services;

use App\Models\Company;
use App\Models\MessageSetting;
use App\Models\Branch;

use App\Jobs\SendWhatsAppMessageJob;
use Log;
use Auth;

trait WhatsappApiService
{
	
	// issue register confirmation message

    // to send  service request, service completed, and ready for delivery  messages


    public function sendServiceMessages($data)
    {

        try
        {
            //$company=Company::first();
            $branch=Branch::where('id',$data['branch_id'])->first();
            
            if($branch)
            {
                $cust_care_no=" ".$branch->country_code.$branch->customer_care_number;
            }
            else
            {
                $cust_care_no=" +919388114405";
            }

            $mset=MessageSetting::where('status',1)->first();
            if(!empty($mset))
            {
                $data['endpoint'] = $mset->whatsapp_api;
                $data['api_token']=$mset->api_token;
                $data['phone_number_id']=$mset->phone_number_id;
                $data['customer_care']=$cust_care_no??"-";

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
