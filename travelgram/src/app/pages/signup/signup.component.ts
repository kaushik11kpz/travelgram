import { Component, OnInit } from '@angular/core';
//angular form
import { NgForm } from '@angular/forms';

import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
//services
import { AuthService } from 'src/app/services/auth.service';
//rxjs
import { finalize } from "rxjs/operators";
//firebase
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { AngularFireDatabase} from "@angular/fire/compat/database";
//browser-image-resizer
import { readAndCompressImage } from "browser-image-resizer";
import { imageConfig } from 'src/utils/config';



@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  picture:string = "https://learnyst.s3.amazonaws.com/assets/schools/2410/resources/images/logo_lco_i3oab.png";

  uploadPercent = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage
  ) { }

  ngOnInit(): void {
  }

  onSubmit(f: NgForm){
     const {email, password, username, country, bio, name} = f.form.value;
     //furthur checking--do here
     this.auth.signUp(email, password)
     .then((res) => {
       console.log(res);
       const {uid} = res.user;
       this.db.object(`users/${uid}`)
       .set({
         id: uid,
         name: name,
         email: email,
         instaUserName: username,
         country: country,
         bio: bio,
         picture: this.picture
       })
     })
     .then(() => {
       this.router.navigateByUrl('/');
       this.toastr.success("SignUp Success");
     })
     .catch((err)=> {
       console.log(err.message);
       this.toastr.error("SignUp failed");
     })
  }

  async uploadFile(event){
    const file = event.target.files[0];
    let resizedImage = await readAndCompressImage(file,imageConfig);

    const filePath = file.name; //TODO: Name the image with uuid
    const fileRef = this.storage.ref(filePath);

    const task = this.storage.upload(filePath,resizedImage);

    task.percentageChanges().subscribe((percentage) => {
      this.uploadPercent = percentage;
    });

    task.snapshotChanges()
    .pipe(
      finalize(() => {
        fileRef.getDownloadURL().subscribe((url) => {
          this.picture = url;
          this.toastr.success('image upload success');
        })
      })
    )
    .subscribe()
  }

}
