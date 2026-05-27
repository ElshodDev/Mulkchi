import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-reports-management',
  template: `
    <div class="reports-container">
      <h2>Shikoyatlar</h2>
      <table class="reports-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Property</th>
            <th>Message</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (r of reports; track r.id) {
            <tr>
              <td>{{ r.id }}</td>
              <td>{{ r.propertyId }}</td>
              <td>{{ r.message }}</td>
              <td>{{ r.status }}</td>
              <td>
                <button (click)="changeStatus(r.id, 'Reviewed')">Mark Reviewed</button>
                <button (click)="changeStatus(r.id, 'Closed')">Close</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .reports-container {
        padding: 16px;
      }
      .reports-table {
        width: 100%;
        border-collapse: collapse;
      }
      .reports-table th,
      .reports-table td {
        border: 1px solid #ddd;
        padding: 8px;
      }
    `,
  ],
})
export class ReportsManagementComponent implements OnInit {
  reports: any[] = [];

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.reportService.getReports(1, 100).subscribe((res) => {
      this.reports = res.items;
    });
  }

  changeStatus(id: string, status: string) {
    this.reportService.updateReportStatus(id, status).subscribe(() => this.load());
  }
}
