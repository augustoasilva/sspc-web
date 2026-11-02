import { Component } from '@angular/core';

// Placeholder home (research G2, US4 T091): a centred card with the name and the provisional
// message. No primary action; the tab bar of the shell leads to About.
@Component({
  selector: 'sspc-home-page',
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  protected readonly name = 'SSPC Studio';
  protected readonly message = 'Em breve, o seu caderno de campo vai morar aqui.';
}
