'use strict';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.9.2/firebase-app.js';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/9.9.2/firebase-firestore-lite.js';

// prettier-ignore

const form = document.querySelector('.form');
const inputType = document.querySelector('.form__input--type');
const inputFirstName = document.querySelector('.form__input--fname');
const inputLastName = document.querySelector('.form__input--lname');
const inputContact = document.querySelector('.form__input--contact');
const timeOfClick = document.querySelector('.time');
const latOfClick = document.querySelector('.lat');
const lngOfClick = document.querySelector('.lng');
const dateOfClick = document.querySelector('.date');
let time, hours, minutes, seconds, date, month, year;

class Fire {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, fName, lName, contact) {
    this.coords = coords;
    this.fName = fName;
    this.lName = lName;
    this.contact = contact;
  }
}

class App {
  #map;
  #mapEvent;
  #fires = [];
  #firebaseConfig = {
    apiKey: 'AIzaSyD5cyy6FpX78UXaSyWQtMDIjLqXst3QBeA',
    authDomain: 'andelo2.firebaseapp.com',
    projectId: 'andelo2',
    storageBucket: 'andelo2.appspot.com',
    messagingSenderId: '940734269166',
    appId: '1:940734269166:web:ec78bc34afe2feb38095ff',
  };
  #firestoreDb;

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newFire.bind(this));
    //ovo je stavljeno u constructor jer se on prvo poziva kod stvaranja objekta

    const firestoreInstance = initializeApp(this.#firebaseConfig);
    this.#firestoreDb = getFirestore(firestoreInstance);
  }

  async #getFiresFromDb() {
    const firesCol = collection(this.#firestoreDb, 'fires');
    const firesSnap = await getDocs(firesCol);
    return firesSnap.docs.map(doc => doc.data());
  }

  async #saveFireInDb(fire) {
    await setDoc(
      doc(this.#firestoreDb, 'fires', new Date().getTime().toString()),
      JSON.parse(JSON.stringify(fire))
    );
  }

  _getPosition() {
    if (navigator.geolocation)
      //Koristimo geolocation API za prikaz karte
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    //console.log(
    //  `https://www.google.com/maps/search/google+maps/@${latitude},${longitude}`
    //); //izvlacimo trenutne koordinate

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13); // u ovu varijablu spremamo prikaz karte

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    // leafletov event listener
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputFirstName.focus();
    time = new Date();
    hours = String(time.getHours()).padStart(2, '0');
    minutes = String(time.getMinutes()).padStart(2, '0');
    seconds = String(time.getSeconds()).padStart(2, '0');
    date = time.getDate();
    month = time.getMonth() + 1;
    year = time.getFullYear();
    //console.log(`${hours}:${minutes}:${seconds}`); // ovo isto za prikazat na aplikaciji
    //console.log(`Širina: ${latitude}, Dužina: ${longitude}`); //Ovo mi treba za prikazat na aplikaciji

    timeOfClick.textContent = `Vrijeme: ${hours}:${minutes}:${seconds}`;
    dateOfClick.textContent = `Datum: ${date}.${month}.${year}.`;
    latOfClick.textContent = `Zemljopisna širina: ${this.#mapEvent.latlng.lat}`;
    lngOfClick.textContent = `Zemljopisna dužina: ${this.#mapEvent.latlng.lng}`;
  }

  _newFire(e) {
    const validInputs = (...inputs) => inputs.every(inp => inp !== '');
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    //console.log(type);
    const typeText = function (type) {
      let option = '';
      if (type === 'open_fire') {
        option = 'Požar otvorenog prostora';
      } else if (type === 'closed_fire') {
        option = 'Požar zatvorenog prostora';
      } else if (type === 'tech_interv') {
        option = 'Tehnička intervencija';
      }
      return option;
    };

    const firstName = inputFirstName.value;
    const lastName = inputLastName.value;
    const personContact = inputContact.value;
    const { lat, lng } = this.#mapEvent.latlng;
    // Check if data is valid
    if (!validInputs(firstName, lastName, personContact)) {
      return alert('Popunite sva polja!');
    }
    // If activity create object
    const fire = new Fire([lat, lng], firstName, lastName, personContact);
    //console.log(fire);
    // Add new object to fires array
    this.#fires.push(fire);

    this.#saveFireInDb(fire);
    // Render workout on map as marker (display marker)
    //console.log(mapEvent);

    L.marker([lat, lng]) // prikaz pin-a(pribadace)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false, // da se ne zatvara kad kliknemo drugu lokaciju
          closeOnClick: false, // da mozemo izac na klik
          className: 'fire-popup', // boja iz css-a
        })
      )
      .setPopupContent(
        `🔥 ${typeText(
          type
        )}, Vrijeme: ${hours}:${minutes}:${seconds}, Datum: ${date}.${month}.${year}. Prijavio: ${firstName} ${lastName}.`
      )
      .openPopup();
    // Hide form + Clear input fields
    inputFirstName.value = inputLastName.value = inputContact.value = '';
  }
}

const app = new App();
