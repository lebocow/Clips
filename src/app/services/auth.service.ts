import { Injectable } from '@angular/core';
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
import { Observable } from 'rxjs';
import { map, delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public isAuthenticated$: Observable<boolean>;
  private usersRef = collection(this.db, 'users');
  private user$ = user(this.auth);

  constructor(private auth: Auth, private db: Firestore) {
    this.isAuthenticated$ = this.user$.pipe(
      map((user) => !!user),
      delay(1000)
    );
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

  public async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      this.handleError('Error logging out user', error);
    }
  }

  private handleError(message: string, error: any): void {
    console.error(`${message} `, error);
    throw error;
  }
}
