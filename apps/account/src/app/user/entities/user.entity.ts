import { AccountChangedCourse } from '@purple/contracts';
import {
  IDomainEvent,
  IUser,
  IUserCourses,
  PurchaseState,
  UserRole,
} from '@purple/interfaces';
import { compare, genSalt, hash } from 'bcryptjs';

export class UserEntity implements IUser {
  _id: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  courses: IUserCourses[];
  events: IDomainEvent[] = [];

  constructor(user: IUser) {
    this.passwordHash = user.passwordHash;
    this._id = user._id;
    this.displayName = user?.displayName;
    this.email = user.email;
    this.role = user.role;
    this.courses = user.courses;
  }

  public async setPassword(password: string) {
    const salt = await genSalt(10);
    this.passwordHash = await hash(password, salt);
    return this;
  }

  public validatePassword(password: string) {
    return compare(password, this.passwordHash);
  }

  public updateProfile(displayName: string) {
    this.displayName = displayName;
    return this;
  }

  public getUserProfile() {
    return {
      email: this.email,
      role: this.role,
      displayName: this.displayName,
    };
  }

  public setCourseStatus(courseId: string, status: PurchaseState) {
    const alreadyExist = this.courses.find((c) => c.courseId === courseId);
    if (alreadyExist) {
      this.courses.push({
        courseId,
        purchaseState: status,
      });
      return this;
    }
    if(status === PurchaseState.Canceled) {
      this.courses = this.courses.filter(c => c.courseId !== courseId)
      return this;
    }
    this.courses = this.courses.map((c) => {
      if (c.courseId === courseId) {
        c.purchaseState = status;
      }
      return c;
    });
    this.events.push({
      topic: AccountChangedCourse.topic, 
      data: {courseId, userId: this._id, status}
    })
    return this;
  }

  public getCourseState(courseId: string) : PurchaseState {
    return this.courses.find( c=> c.courseId === courseId)?.purchaseState ?? PurchaseState.Started;
  }
}
