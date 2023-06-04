import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  user,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
} from '@angular/fire/firestore';
import IUser from '../models/user.model';
import { Observable, of } from 'rxjs';
import { map, delay, filter, switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

interface RouteData {
  authOnly?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private redirect = false;

  private usersRef = collection(this.db, 'users');
  private user$ = user(this.auth);

  public isAuthenticated$: Observable<boolean> = this.user$.pipe(
    map((user) => !!user)
  );
  public isAuthenticatedwDelay$: Observable<boolean> = this.user$.pipe(
    map((user) => !!user),
    delay(3000)
  );

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        map(() => this.route.firstChild),
        switchMap((route) => route?.data ?? of({}))
      )
      .subscribe((data: RouteData) => {
        this.redirect = data.authOnly ?? false;
      });
  }

  public async createUser(userData: IUser): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );

      const user: User = userCredential.user;
      await this.updateUserDisplayName(user, userData.name as string);
      await this.setUserDocument(user, userData);
    } catch (error) {
      this.handleError('Error creating user: ', error);
    }
  }

  private async updateUserDisplayName(user: User, name: string): Promise<void> {
    return updateProfile(user, { displayName: name });
  }

  private async setUserDocument(user: User, userData: IUser): Promise<void> {
    const userDocRef = doc(this.usersRef, user.uid);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      const createdAt = new Date();
      try {
        await setDoc(userDocRef, {
          name: userData.name,
          email: userData.email,
          age: userData.age,
          phoneNumber: userData.phoneNumber,
          createdAt,
        });
      } catch (error) {
        console.log('error creating the user', error);
        throw error;
      }
    }
  }

  public async loginUser(userData: IUser): Promise<void> {
    try {
      await signInWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );
    } catch (error) {
      this.handleError('Error signing in user', error);
    }
  }

  public async logout($event: Event): Promise<void> {
    $event && $event.preventDefault();

    try {
      await signOut(this.auth);
    } catch (error) {
      this.handleError('Error logging out user', error);
    }

    try {
      this.redirect && (await this.router.navigateByUrl(''));
    } catch (error) {
      this.handleError('Error navigating to specified url', error);
    }
  }

  private handleError(message: string, error: any): void {
    console.error(`${message} `, error);
    throw error;
  }
}
