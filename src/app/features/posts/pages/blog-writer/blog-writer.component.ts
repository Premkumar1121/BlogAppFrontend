import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { BlogService } from '../../../../core/services/blog.service';
import { ImageUploadService } from '../../../../core/services/image-upload.service';
import { FooterComponent } from "../../../../shared/components/footer/footer.component";
import { Tag } from '../../../../shared/interfaces/post.interface';
import { DateUtil } from '../../../../shared/utils/date.util';

export interface BlogBlock {
  id: string;
  type: 'subtitle' | 'content' | 'image';
  data: string;
  placeholder?: string;
}

@Component({
  selector: 'app-blog-writer',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent],
  templateUrl: './blog-writer.component.html',
  styleUrl: './blog-writer.component.css'
})
export class BlogWriterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Blog data
  blogTitle = '';
  blogBlocks: BlogBlock[] = [];
  
  // UI state
  showAddMenu = false;
  currentBlockId: string | null = null;
  isAuthenticated = false;
  isSaving = false;
  isUploadingImage = false;
  
  // Publish modal state
  showPublishModal = false;
  isPublishing = false;
  isUploadingMainImage = false;
  mainImageUrl = '';
  selectedTags: string[] = [];
  newTagInput = '';
  availableTags: Tag[] = [];
  isLoadingTags = false;
  
  // Message container
  showMessage = false;
  messageText = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  
  // Menu options
  blockTypes: { type: BlogBlock['type'], label: string, icon: string }[] = [
    { type: 'subtitle', label: 'Subtitle', icon: 'H2' },
    { type: 'content', label: 'Content', icon: 'P' },
    { type: 'image', label: 'Image', icon: 'IMG' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private blogService: BlogService,
    private imageUploadService: ImageUploadService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadAvailableTags();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthStatus(): void {
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isAuth: boolean) => {
      this.isAuthenticated = isAuth;
      if (!isAuth) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  // Generate unique ID for blocks
  private generateId(): string {
    return 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Toggle add menu
  toggleAddMenu(blockId?: string): void {
    this.currentBlockId = blockId || null;
    this.showAddMenu = !this.showAddMenu;
  }

  // Close add menu
  closeAddMenu(): void {
    this.showAddMenu = false;
    this.currentBlockId = null;
  }

  // Add new block
  addBlock(type: BlogBlock['type']): void {
    const newBlock: BlogBlock = {
      id: this.generateId(),
      type,
      data: '',
      placeholder: this.getPlaceholder(type)
    };

    if (this.currentBlockId) {
      // Insert after current block
      const index = this.blogBlocks.findIndex(block => block.id === this.currentBlockId);
      this.blogBlocks.splice(index + 1, 0, newBlock);
    } else {
      // Add to end
      this.blogBlocks.push(newBlock);
    }

    this.closeAddMenu();
    
    // Focus on the new block after a short delay
    setTimeout(() => {
      const element = document.getElementById(`block-${newBlock.id}`);
      if (element) {
        element.focus();
      }
    }, 100);
  }

  // Get placeholder text for block type
  private getPlaceholder(type: string): string {
    switch (type) {
      case 'subtitle': return 'Enter subtitle...';
      case 'content': return 'Start writing your content...';
      case 'image': return 'Enter image URL...';
      default: return 'Enter text...';
    }
  }

  // Remove block
  removeBlock(blockId: string): void {
    const index = this.blogBlocks.findIndex(block => block.id === blockId);
    if (index > -1) {
      this.blogBlocks.splice(index, 1);
    }
  }

  // Move block up
  moveBlockUp(blockId: string): void {
    const index = this.blogBlocks.findIndex(block => block.id === blockId);
    if (index > 0) {
      const block = this.blogBlocks[index];
      this.blogBlocks.splice(index, 1);
      this.blogBlocks.splice(index - 1, 0, block);
    }
  }

  // Move block down
  moveBlockDown(blockId: string): void {
    const index = this.blogBlocks.findIndex(block => block.id === blockId);
    if (index < this.blogBlocks.length - 1) {
      const block = this.blogBlocks[index];
      this.blogBlocks.splice(index, 1);
      this.blogBlocks.splice(index + 1, 0, block);
    }
  }

  // Handle block content change
  onBlockChange(blockId: string, value: string): void {
    const block = this.blogBlocks.find(b => b.id === blockId);
    if (block) {
      block.data = value;
    }
  }

  // Auto-resize textarea
  autoResize(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }

  // Preview blog content
  previewBlog(): void {
    const blogData = {
      title: this.blogTitle,
      blocks: this.blogBlocks
    };
    console.log('Blog Preview:', blogData);
    
    // Here you could open a preview modal or navigate to preview page
    alert('Preview feature will be implemented. Check console for blog data.');
  }

  // Open publish modal
  openPublishModal(): void {
    if (!this.blogTitle.trim()) {
      alert('Please enter a blog title');
      return;
    }

    if (this.blogBlocks.length === 0) {
      alert('Please add some content blocks');
      return;
    }

    this.showPublishModal = true;
  }

  // Handle image file selection
  onImageFileSelect(event: Event, blockId: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showMessageContainer('Please select a valid image file', 'error');
      return;
    }
    
    // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          this.showMessageContainer('Image size should be less than 5MB', 'error');
          return;
        }
        
        this.uploadImageToS3(file, blockId);
  }
  
  // Upload image to AWS S3
  private uploadImageToS3(file: File, blockId: string): void {
    const block = this.blogBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    this.isUploadingImage = true;
    
    this.imageUploadService.uploadImage(file).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('Full upload response:', response);
        if (response && response.imageUrl) {
          block.data = response.imageUrl;
          console.log('Image uploaded to S3 successfully:', response.imageUrl);
          this.showMessageContainer('Image uploaded successfully!', 'success');
          this.isUploadingImage = false;
        } else {
          console.error('Invalid response format:', response);
          this.showMessageContainer('Invalid response from server. Please try again.', 'error');
          this.isUploadingImage = false;
        }
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.isUploadingImage = false;
      }
    });
  }
  
  // Trigger file input for image upload
  selectImageFile(blockId: string): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => this.onImageFileSelect(event!, blockId);
    input.click();
  }

  // Discard changes and go back
  discardChanges(): void {
    if (this.blogTitle || this.blogBlocks.length > 0) {
        this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  // Handle click outside to close menu
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.add-menu-container')) {
      this.closeAddMenu();
    }
  }

  // Load available tags
  private loadAvailableTags(): void {
    this.isLoadingTags = true;
    this.blogService.getTags().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (tags) => {
        this.availableTags = tags;
        this.isLoadingTags = false;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.isLoadingTags = false;
        // Fallback to some default tags
        this.availableTags = [
          { _id: '1', name: 'Technology', created_at: new Date().toISOString() },
          { _id: '2', name: 'Programming', created_at: new Date().toISOString() },
          { _id: '3', name: 'Web Development', created_at: new Date().toISOString() },
          { _id: '4', name: 'JavaScript', created_at: new Date().toISOString() },
          { _id: '5', name: 'Angular', created_at: new Date().toISOString() },
          { _id: '6', name: 'Tutorial', created_at: new Date().toISOString() }
        ];
      }
    });
  }

  // Handle main image file selection
  onMainImageFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showMessageContainer('Please select a valid image file', 'error');
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showMessageContainer('Image size should be less than 5MB', 'error');
      return;
    }
    
    this.uploadMainImageToS3(file);
  }

  // Upload main image to AWS S3
  private uploadMainImageToS3(file: File): void {
    this.isUploadingMainImage = true;
    
    this.imageUploadService.uploadImage(file).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.mainImageUrl = response.imageUrl;
        console.log('Main image uploaded to S3:', response.imageUrl);
        this.showMessageContainer('Main image uploaded successfully!', 'success');
        this.isUploadingMainImage = false;
      },
      error: (error) => {
        console.error('Error uploading main image:', error);
        this.showMessageContainer('Failed to upload main image. Please try again.', 'error');
        this.isUploadingMainImage = false;
      }
    });
  }

  // Select main image file
  selectMainImageFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => this.onMainImageFileSelect(event!);
    input.click();
  }

  // Remove main image
  removeMainImage(): void {
    this.mainImageUrl = '';
  }

  // Add custom tag
  addCustomTag(): void {
    const tagName = this.newTagInput.trim();
    
    if (!tagName) {
      alert('Please enter a tag name');
      return;
    }
    
    if (this.selectedTags.includes(tagName)) {
      alert('Tag already added');
      return;
    }
    
    if (this.selectedTags.length >= 10) {
      alert('Maximum 10 tags allowed');
      return;
    }
    
    this.selectedTags.push(tagName);
    this.newTagInput = '';
  }

  // Remove tag from selected
  removeTag(tagName: string): void {
    const index = this.selectedTags.indexOf(tagName);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    }
  }

  // Add tag from recommended list
  addRecommendedTag(tagName: string): void {
    if (!this.selectedTags.includes(tagName)) {
      if (this.selectedTags.length >= 10) {
        alert('Maximum 10 tags allowed');
        return;
      }
      this.selectedTags.push(tagName);
    }
  }

  // Close publish modal
  closePublishModal(): void {
    this.showPublishModal = false;
    this.mainImageUrl = '';
    this.selectedTags = [];
    this.newTagInput = '';
  }

  // Publish blog
  publishBlog(): void {
    this.isPublishing = true;

    // Convert blocks to content string
    const contentJsonString = JSON.stringify(this.blogBlocks);

    // Create blog data for publishing - use appropriate API structure
    const blogData = {
      title: this.blogTitle,
      content: contentJsonString,
      tags: this.selectedTags,
      main_image_url: this.mainImageUrl || '',
      published: true
    };

    console.log('Publishing blog:', blogData);

    // Publish to MongoDB via API
    this.blogService.createBlog(blogData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('Blog published successfully:', response);
        this.isPublishing = false;
        this.closePublishModal();
        this.showMessageContainer('Blog published successfully!', 'success');
        
        // Navigate to home or blog list after a short delay
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error publishing blog:', error);
        this.isPublishing = false;
        this.showMessageContainer('Error publishing blog. Please try again.', 'error');
      }
    });
  }

  // Track by function for ngFor optimization
  trackByBlockId(index: number, block: BlogBlock): string {
    return block.id;
  }

  // Message container methods
  showMessageContainer(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.messageText = text;
    this.messageType = type;
    this.showMessage = true;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      this.hideMessage();
    }, 5000);
  }

  hideMessage(): void {
    this.showMessage = false;
    this.messageText = '';
  }

  // Handle image load event
  onImageLoad(event: Event, blockId: string): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'block';
    }
  }

  // Handle image error event
  onImageError(event: Event, blockId?: string): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.getDefaultImage();
    }
  }

  // Handle main image error event
  onMainImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.getDefaultImage();
      this.showMessageContainer('Failed to load main image. Using default image.', 'error');
    }
  }

  // Get default image placeholder
  getDefaultImage(): string {
    return 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }
}

