import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { UIService } from 'src/app/shared/ui.service';

import * as fromRoot from '../../app.reducer';
import * as fromTraining from '../training.reducer';
import { ExerciseModel } from './../model/exercise.model';
import { TrainingService } from './../services/training.service';

@Component({
  selector: 'app-new-training',
  templateUrl: './new-training.component.html',
  styleUrls: ['./new-training.component.css']
})
export class NewTrainingComponent implements OnInit {

  exercises$: Observable<ExerciseModel[]>;
  isLoading$: Observable<boolean>;

  constructor(private trainingService: TrainingService,
    private uiService: UIService,
    private store: Store<fromTraining.State>) { }

  ngOnInit(): void {
    this.isLoading$ = this.store.select(fromRoot.getIsLoading);
    this.exercises$ = this.store.select(fromTraining.getAvailableExercises);
    this.fetchExercises();
  }

  onStartTraining(form: NgForm) {
    this.trainingService.startExercise(form.value.exercise)
  }

  fetchExercises() {
    this.trainingService.fetchAvailableExercises();
  }

}
