import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AngularFirestore } from 'angularfire2/firestore';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { take } from 'rxjs/operators';

import * as UI from '../../shared/ui.actions';
import * as Training from '../training.actions';
import * as fromTraining from '../training.reducer';
import { UIService } from './../../shared/ui.service';
import { ExerciseModel } from './../model/exercise.model';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {
  constructor(
    private db: AngularFirestore,
    private uiService: UIService,
    private store: Store<fromTraining.State>) { }

  private fbSubs: Subscription[] = [];

  fetchAvailableExercises() {
    this.uiService.loadingStateChanged.next(true);
    this.fbSubs.push(
      this.db
        .collection('availableExersices')
        .snapshotChanges()
        .pipe(
          map(docData => {
            // throw (new Error());
            return docData.map(doc => {
              return {
                id: doc.payload.doc.id,
                name: doc.payload.doc.data()['name'],
                duration: doc.payload.doc.data()['duration'],
                calories: doc.payload.doc.data()['calories']
              };
            });
          }))
        .subscribe((exercises: ExerciseModel[]) => {
          this.store.dispatch(new UI.StopLoading());
          this.store.dispatch(new Training.SetAvailableTrainings(exercises));
        },
          error => {
            this.uiService.loadingStateChanged.next(false);
            this.uiService.showSnackbar('Fetching Exercises failed, please try again later', null, 3000);
          }
        ));
  }

  startExercise(selectedId: string) {
    this.store.dispatch(new Training.StartTraining(selectedId));
  }

  completeExercise() {
    this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
      this.addDataToDataBase({
        ...ex,
        date: new Date(),
        state: 'completed'
      });
      this.store.dispatch(new Training.StopTraining());
    })
  }

  cancelExercise(progress: number) {
    this.store.select(fromTraining.getActiveTraining).pipe(take(1)).subscribe(ex => {
      this.addDataToDataBase({
        ...ex,
        duration: ex.duration * (progress / 100),
        calories: ex.calories * (progress / 100),
        date: new Date(),
        state: 'cancelled'
      });
      this.store.dispatch(new Training.StopTraining());
    });
  }

  fetchCompletedOrCancelledExercises() {
    this.fbSubs.push(this.db
      .collection('finishedExercises')
      .valueChanges()
      .subscribe(
        (exercises: ExerciseModel[]) => {
          this.store.dispatch(new Training.SetFinishedTrainings(exercises));
        }
      ))
  }

  cancelSubscriptions() {
    this.fbSubs.forEach(sub => sub.unsubscribe);
  }

  private addDataToDataBase(exersice: ExerciseModel) {
    this.db.collection('finishedExercises').add(exersice);
  }

}
