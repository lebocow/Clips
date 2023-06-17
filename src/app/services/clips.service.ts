import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Auth, User, user } from '@angular/fire/auth';
import { BehaviorSubject, Observable, from, of, switchMap, map } from 'rxjs';
import IClip from '../models/clip.model';
import { Storage, deleteObject, ref } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class ClipsService {
  private db = inject(Firestore);
  private auth = inject(Auth);
  private user$ = user(this.auth);
  private storage = inject(Storage);

  public clipsCollection = collection(this.db, 'clips');
  public storageRef = ref(this.storage, 'clips');

  async createClip(data: IClip) {
    return addDoc(this.clipsCollection, data);
  }

  getUserClips(sort$: BehaviorSubject<string>): Observable<IClip[]> {
    return this.user$.pipe(
      switchMap((user) =>
        user
          ? sort$.pipe(
              switchMap((sort) =>
                this.getClipsByUser(user, sort === '1' ? 'asc' : 'desc')
              )
            )
          : of([])
      )
    );
  }

  private getClipsByUser(
    user: User,
    sort: 'asc' | 'desc'
  ): Observable<IClip[]> {
    const userClipsQuery = query(
      this.clipsCollection,
      where('uid', '==', user.uid),
      orderBy('timestamp', sort)
    );

    return from(getDocs(userClipsQuery)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => ({
          docID: doc.id,
          ...(doc.data() as IClip),
        }))
      )
    );
  }

  async updateClipTitle(id: string, title: string) {
    try {
      const clipDocRef = doc(this.clipsCollection, id);
      const result = await updateDoc(clipDocRef, { title });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteClip(clip: IClip) {
    try {
      const clipStRef = ref(this.storageRef, clip.fileName);
      await deleteObject(clipStRef);

      const clipDocRef = doc(this.clipsCollection, clip.docID);
      await deleteDoc(clipDocRef);
    } catch (error) {
      throw error;
    }
  }
}
