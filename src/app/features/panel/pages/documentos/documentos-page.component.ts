import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DocumentsLibraryService } from '../../services/documents-library.service';

@Component({
  selector: 'app-documentos-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h5>Carpetas</h5>
      <ul class="list-group mb-3">
        <li class="list-group-item" *ngFor="let folder of folders">{{ folder.name }}</li>
      </ul>
      <h5>Documentos</h5>
      <ul class="list-group">
        <li class="list-group-item" *ngFor="let doc of documents">{{ doc.title }}</li>
      </ul>
    </section>
  `,
})
export class DocumentosPageComponent implements OnInit {
  folders: any[] = [];
  documents: any[] = [];

  constructor(private readonly docsService: DocumentsLibraryService) {}

  async ngOnInit(): Promise<void> {
    this.folders = await this.docsService.listFolders();
    this.documents = await this.docsService.listDocuments();
  }
}

