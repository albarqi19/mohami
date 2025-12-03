<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'national_id',
        'password',
        'pin',
        'role',
        'phone',
        'avatar',
        'is_active',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'pin',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Get the cases created by this user.
     */
    public function createdCases()
    {
        return $this->hasMany(CaseModel::class, 'created_by');
    }

    /**
     * Get the cases assigned to this user (for lawyers).
     */
    public function assignedCases()
    {
        return $this->belongsToMany(CaseModel::class, 'case_lawyers', 'lawyer_id', 'case_id')
                    ->withPivot('assigned_at', 'assigned_by', 'is_primary')
                    ->withTimestamps();
    }

    /**
     * Get the tasks assigned to this user.
     */
    public function assignedTasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    /**
     * Get the tasks created by this user.
     */
    public function createdTasks()
    {
        return $this->hasMany(Task::class, 'assigned_by');
    }

    /**
     * Get the documents uploaded by this user.
     */
    public function documents()
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    /**
     * Get the comments written by this user.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class, 'author_id');
    }

    /**
     * Get the activities performed by this user.
     */
    public function activities()
    {
        return $this->hasMany(Activity::class, 'performed_by');
    }

    /**
     * Get the notifications for this user.
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get the user preferences.
     */
    public function preferences()
    {
        return $this->hasOne(UserPreference::class);
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is lawyer.
     */
    public function isLawyer(): bool
    {
        return $this->role === 'lawyer';
    }

    /**
     * Check if user is legal assistant.
     */
    public function isLegalAssistant(): bool
    {
        return $this->role === 'legal_assistant';
    }

    /**
     * Check if user is client.
     */
    public function isClient(): bool
    {
        return $this->role === 'client';
    }
}
