import { Timestamp } from '@angular/fire/firestore';

export default interface IClip {
  docID?: string;
  uid: string;
  displayName: string;
  title: string;
  fileName: string;
  screenshotFileName: string;
  url: string;
  screenshotUrl: string;
  timestamp: Timestamp;
}
