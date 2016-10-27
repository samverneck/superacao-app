import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, MenuController } from 'ionic-angular';
import { FirebaseAuth, AuthProviders, AuthMethods } from 'angularfire2';
import { UserStorageService } from '../../providers/database/user-storage-service';
import { DateUtil } from '../../providers/util/date-util';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Facebook } from 'ionic-native';

import { ApresentationPage } from '../apresentation/apresentation';
import { TabsPage } from '../tabs/tabs';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})


export class LoginPage {

  messages;
  ctrlLogo = false;
  loading;
  authType;
  isConnect;

 // --- FORM DATAS -----
  formSignup: FormGroup;
  formLogin : FormGroup;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public menuCtrl: MenuController,
    public fb : FormBuilder,
    public auth : FirebaseAuth,
    public userStorageService : UserStorageService,
    public dateUtil: DateUtil,
  ) {
      // ===== Validators ======
      this.formSignup = this.fb.group({
        name: ["", Validators.required],
        email: ["", Validators.required],
        pass: ["", [Validators.required, Validators.minLength(6)]],
        passConfirm: ["", [Validators.required, Validators.minLength(6)]]
      });

      this.formLogin = this.fb.group({
        email: ["", Validators.required],
        pass:  ["", [Validators.required, Validators.minLength(6)]]
      })


      this.authType = 'login';
      this.isConnect = false;


      this.messages = {
        email_already : "auth/email-already-in-use",
        email_invalid : "auth/invalid-email",
        email_not_found : "auth/user-not-found",
        password_wrong : "auth/wrong-password",
        weak_password : "auth/weak-password"
      }
  }

  // ===================================== SIGNUP ===================================
  signup(credentials) {
    this._showLoading();

    if(this._validateForm(credentials)) {
      this._showError(this._validateForm(credentials));
      return;
    }

    this.auth.createUser({
      email: credentials.email,
      password: credentials.pass
    }).then((authData) => {
      this.isConnect = authData;
      this.loading.dismiss();

      // === Register user  ===
      this.userStorageService.registerUser({
        name: credentials.name,
        provider: authData.provider,
        uid: authData.uid,
        email: credentials.email});

        let alert = this.alertCtrl.create({
          title: "Sucesso!",
          subTitle: "Sua conta foi criada com sucesso! Realize o login!",
          buttons: ['Ok']
        });

        alert.present();
        this.loading.dismiss();
    }).catch((error: any) => {
      if(this.messages.email_already === error.code) {
        this._showError("Usuário já cadastrado");
      } else if (this.messages.weak_password === error.code){
        this._showError("A senha deve conter no minimo 6 digitos");
      } else if (this.messages.email_invalid === error.code) {
        this._showError("Digite um e-mail valido!");
      }
      console.log(error);
    });

    setTimeout(() => {
      if(!this.isConnect) {
        this._showError("Falha ao tentar se conectar");
        this.loading.dismiss();
        return;
      }
    }, 5000);
  }

  // ===================================== OTHERS METHODS ===================================
  _showLoading() {
    this.loading = this.loadingCtrl.create({
      content: "Aguarde...",
    });

    this.loading.present();
  }

  _showError(text) {
    this.loading.dismiss();
    let alert = this.alertCtrl.create({
      title: "Ocorreu algum erro!",
      subTitle: text,
      buttons: ['Ok']
    });

    alert.present();
  }

  _validateForm(credentials) : any {
    if(!credentials.email || !credentials.pass || !credentials.passConfirm) {
      return 'Preencha todos os campos';
    }

    if(!(credentials.pass === credentials.passConfirm)) {
      return 'As senhas digitadas não são iguais';
    }

    return false;
  }

  _validateLoginSocial(authData) {
    this.userStorageService.findUser(authData.uid).then((user: any) => {

      if(user.$value === null) {
        this.userStorageService.registerUser(authData);
      }

      // === Set Storage ===
      this.userStorageService.findUser(authData.uid).then((datas) => {
        this.loading.dismiss();
        this.userStorageService.setUserLocal(datas);
      });
    });
  }



}