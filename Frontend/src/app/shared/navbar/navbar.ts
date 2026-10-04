import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar.component';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class Navbar extends NavbarComponent {}
