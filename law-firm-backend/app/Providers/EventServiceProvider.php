<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

use App\Events\CaseCreated;
use App\Events\CaseUpdated;
use App\Events\UserRegistered;
use App\Events\UserLoggedIn;
use App\Events\DocumentUploaded;
use App\Events\LawyerAssignedToCase;
use App\Events\TaskAssigned;
use App\Events\TaskCompleted;
use App\Events\QuickActionPerformed;
use App\Listeners\SendCaseCreatedNotification;
use App\Listeners\SendCaseUpdatedNotification;
use App\Listeners\SendWelcomeMessage;
use App\Listeners\SendLoginNotification;
use App\Listeners\SendDocumentUploadedNotification;
use App\Listeners\SendLawyerAssignedNotification;
use App\Listeners\SendTaskAssignedNotification;
use App\Listeners\LogCaseCreatedActivity;
use App\Listeners\LogCaseUpdatedActivity;
use App\Listeners\LogDocumentUploadedActivity;
use App\Listeners\LogLawyerAssignedActivity;
use App\Listeners\LogTaskAssignedActivity;
use App\Listeners\LogTaskCompletedActivity;
use App\Listeners\LogCaseActivity;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        
        // WhatsApp notification events
        CaseCreated::class => [
            SendCaseCreatedNotification::class,
            LogCaseCreatedActivity::class,
            LogCaseActivity::class,
        ],
        
        CaseUpdated::class => [
            SendCaseUpdatedNotification::class,
            LogCaseUpdatedActivity::class,
            LogCaseActivity::class,
        ],
        
        UserRegistered::class => [
            SendWelcomeMessage::class,
        ],
        
        UserLoggedIn::class => [
            SendLoginNotification::class,
        ],
        
        DocumentUploaded::class => [
            SendDocumentUploadedNotification::class,
            LogDocumentUploadedActivity::class,
            LogCaseActivity::class,
        ],
        
        LawyerAssignedToCase::class => [
            SendLawyerAssignedNotification::class,
            LogLawyerAssignedActivity::class,
            LogCaseActivity::class,
        ],
        
        TaskAssigned::class => [
            SendTaskAssignedNotification::class,
            LogTaskAssignedActivity::class,
            LogCaseActivity::class,
        ],
        
        TaskCompleted::class => [
            LogTaskCompletedActivity::class,
            LogCaseActivity::class,
        ],
        
        QuickActionPerformed::class => [
            LogCaseActivity::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
