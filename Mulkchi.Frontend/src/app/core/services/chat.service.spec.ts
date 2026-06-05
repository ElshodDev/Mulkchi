import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let authServiceSpy: any;
  let sessionServiceSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
      getAccessToken: jasmine.createSpy('getAccessToken'),
      currentUser: jasmine.createSpy('currentUser')
    };
    
    sessionServiceSpy = {
      authChanges$: new Subject<boolean>()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule, RouterTestingModule],
      providers: [
        ChatService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SessionService, useValue: sessionServiceSpy }
      ]
    });

    // Default mock behavior
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getAccessToken.and.returnValue('mock-token');
    authServiceSpy.currentUser.and.returnValue({ id: 'user1' });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get conversations', () => {
    const mockConversations = [
      {
        otherUserId: 'user2',
        propertyId: 'prop1',
        lastMessage: 'Hello',
        lastMessageDate: new Date().toISOString(),
        unreadCount: 1
      }
    ];

    service.getConversations();

    const req = httpMock.expectOne(`${environment.apiUrl}/messages/conversations`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConversations);

    expect(service.conversations().length).toBe(1);
    expect(service.conversations()[0].otherUserId).toBe('user2');
    expect(service.isLoading()).toBe(false);
  });

  it('should get messages for a conversation', () => {
    const mockMessages = [
      {
        id: 'msg1',
        senderId: 'user2',
        receiverId: 'user1',
        content: 'Hello',
        createdDate: new Date().toISOString(),
        isRead: false
      }
    ];

    service.getMessages('user2', 'prop1');

    const req = httpMock.expectOne(`${environment.apiUrl}/messages/conversation/user2?propertyId=prop1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMessages);

    // After getting messages, it marks them as read
    const readReq = httpMock.expectOne(`${environment.apiUrl}/messages/conversations/user2/read-all?propertyId=prop1`);
    expect(readReq.request.method).toBe('PUT');
    readReq.flush({});

    expect(service.currentMessages().length).toBe(1);
    expect(service.currentMessages()[0].content).toBe('Hello');
  });

  it('should mark conversation as read', () => {
    service.markAsRead('user2');

    const req = httpMock.expectOne(`${environment.apiUrl}/messages/conversations/user2/read-all`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
