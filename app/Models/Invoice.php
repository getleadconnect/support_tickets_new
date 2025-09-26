<?php

namespace App\Models;

use App\Enums\InvoiceStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;
	
	protected $guarded=[];

    protected $fillable = [
        'invoice_id',
        'ticket_id',
        'customer_id',
        'branch_id',
        'item_cost',
        'service_charge',
        'total_amount',
        'discount',
        'net_amount',
        'payment_method',
        'status',
        'invoice_date',
        'created_by',
    ];

    protected $casts = [
        'item_cost' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'invoice_date' => 'date',
    ];
    
    public function ticket()
    {
        return $this->belongsTo(Ticket::class,'ticket_id');
    }
    
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
    
    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

}
