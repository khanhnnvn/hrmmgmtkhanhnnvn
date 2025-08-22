import { DatabaseService } from '../lib/database';
import type { Position } from '../types/database';

// Sample candidate data for testing
export const sampleCandidates = [
  {
    full_name: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    phone: "0912345678"
  },
  {
    full_name: "Trần Thị Bình",
    email: "tranthibinh@gmail.com", 
    phone: "0912345679"
  },
  {
    full_name: "Lê Hoàng Cường",
    email: "lehoangcuong@gmail.com",
    phone: "0912345680"
  },
  {
    full_name: "Phạm Minh Đức",
    email: "phamminhduc@gmail.com",
    phone: "0912345681"
  },
  {
    full_name: "Vũ Thị Lan",
    email: "vuthilan@gmail.com",
    phone: "0912345682"
  },
  {
    full_name: "Đinh Văn Hùng",
    email: "dinhvanhung@gmail.com",
    phone: "0912345683"
  },
  {
    full_name: "Ngô Thị Mai",
    email: "ngothimai@gmail.com",
    phone: "0912345684"
  },
  {
    full_name: "Bùi Quang Nam",
    email: "buiquangnam@gmail.com",
    phone: "0912345685"
  }
];

let autoFillRunning = false;
let currentIndex = 0;

export const autoFillForm = async (candidateData: any, positions: Position[], retryCount = 0): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        // Fill full name
        const fullNameInput = document.querySelector('input[placeholder="Nguyễn Văn A"]') as HTMLInputElement;
        if (fullNameInput) {
          fullNameInput.value = candidateData.full_name;
          fullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Fill email
        const emailInput = document.querySelector('input[placeholder="example@gmail.com"]') as HTMLInputElement;
        if (emailInput) {
          emailInput.value = candidateData.email;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Fill phone
        const phoneInput = document.querySelector('input[placeholder="0912345678"]') as HTMLInputElement;
        if (phoneInput) {
          phoneInput.value = candidateData.phone;
          phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Select random position
        const positionSelect = document.querySelector('select') as HTMLSelectElement;
        if (positionSelect && positions.length > 0) {
          const randomPosition = positions[Math.floor(Math.random() * positions.length)];
          positionSelect.value = randomPosition.id;
          positionSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        resolve(true);
      } catch (error) {
        console.error('Auto fill error:', error);
        if (retryCount < 3) {
          setTimeout(() => {
            autoFillForm(candidateData, positions, retryCount + 1).then(resolve);
          }, 1000);
        } else {
          resolve(false);
        }
      }
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  });
};

export const autoSubmitForm = async (retryCount = 0): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
          resolve(true);
        } else if (retryCount < 5) {
          setTimeout(() => {
            autoSubmitForm(retryCount + 1).then(resolve);
          }, 500);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Auto submit error:', error);
        resolve(false);
      }
    }, 2000 + Math.random() * 1000); // Wait 2-3 seconds before submitting
  });
};

export const runAutoFormFiller = async (positions: Position[], candidateIndex = 0): Promise<void> => {
  if (autoFillRunning) {
    console.log('Auto form filler is already running');
    return;
  }

  if (candidateIndex >= sampleCandidates.length) {
    console.log('All sample candidates have been processed');
    autoFillRunning = false;
    return;
  }

  autoFillRunning = true;
  currentIndex = candidateIndex;
  
  console.log(`Starting auto form filler for candidate ${currentIndex + 1}/${sampleCandidates.length}: ${sampleCandidates[currentIndex].full_name}`);

  try {
    const candidateData = sampleCandidates[currentIndex];
    
    // Auto fill form
    const fillSuccess = await autoFillForm(candidateData, positions);
    
    if (fillSuccess) {
      console.log('Form filled successfully, submitting...');
      
      // Auto submit form
      const submitSuccess = await autoSubmitForm();
      
      if (submitSuccess) {
        console.log('Form submitted successfully');
        
        // Wait for form to be processed and success message to show
        setTimeout(() => {
          // Check if success screen is shown
          const successElement = document.querySelector('[class*="green"]') || 
                                 document.querySelector('h2:contains("thành công")') ||
                                 document.querySelector('button:contains("Nộp hồ sơ khác")');
          
          if (successElement) {
            console.log('Success detected, continuing with next candidate...');
            
            // Click "Nộp hồ sơ khác" button if available
            const nextButton = document.querySelector('button:contains("Nộp hồ sơ khác")') as HTMLButtonElement;
            if (nextButton) {
              setTimeout(() => {
                nextButton.click();
                setTimeout(() => {
                  runAutoFormFiller(positions, currentIndex + 1);
                }, 2000);
              }, 1000);
            } else {
              setTimeout(() => {
                runAutoFormFiller(positions, currentIndex + 1);
              }, 3000);
            }
          } else {
            console.log('No success detected, trying next candidate anyway...');
            setTimeout(() => {
              runAutoFormFiller(positions, currentIndex + 1);
            }, 3000);
          }
        }, 3000);
      } else {
        console.error('Failed to submit form, trying next candidate...');
        setTimeout(() => {
          runAutoFormFiller(positions, currentIndex + 1);
        }, 2000);
      }
    } else {
      console.error('Failed to fill form, trying next candidate...');
      setTimeout(() => {
        runAutoFormFiller(positions, currentIndex + 1);
      }, 2000);
    }
  } catch (error) {
    console.error('Auto form filler error:', error);
    autoFillRunning = false;
  }
};

export const stopAutoFill = (): void => {
  autoFillRunning = false;
  console.log('Auto form filler stopped');
};

export const checkFormStatus = (): void => {
  console.log('Auto form filler status:', {
    running: autoFillRunning,
    currentIndex: currentIndex,
    totalCandidates: sampleCandidates.length,
    currentCandidate: autoFillRunning ? sampleCandidates[currentIndex] : null
  });
};

export const fixValidationErrors = (): void => {
  // Try to fix common validation errors
  const errorElements = document.querySelectorAll('[class*="text-red-600"]');
  if (errorElements.length > 0) {
    console.log('Found validation errors, attempting to fix...');
    
    errorElements.forEach((error) => {
      const errorText = error.textContent;
      console.log('Error:', errorText);
      
      // Try to find the related input field and fix common issues
      const parentElement = error.closest('div');
      const inputElement = parentElement?.querySelector('input, select') as HTMLInputElement | HTMLSelectElement;
      
      if (inputElement) {
        if (errorText?.includes('email')) {
          // Fix email format
          if (inputElement.value && !inputElement.value.includes('@')) {
            inputElement.value = inputElement.value + '@gmail.com';
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } else if (errorText?.includes('điện thoại')) {
          // Fix phone format
          if (inputElement.value.length < 9) {
            inputElement.value = '091234567' + Math.floor(Math.random() * 10);
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } else if (errorText?.includes('vị trí')) {
          // Select first available option
          if (inputElement.tagName === 'SELECT') {
            const selectElement = inputElement as HTMLSelectElement;
            if (selectElement.options.length > 1) {
              selectElement.selectedIndex = 1;
              selectElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      }
    });
  }
};

// Expose functions to window for console access
declare global {
  interface Window {
    autoFormFiller: {
      runAutoFormFiller: typeof runAutoFormFiller;
      stopAutoFill: typeof stopAutoFill;
      checkFormStatus: typeof checkFormStatus;
      fixValidationErrors: typeof fixValidationErrors;
    };
  }
}

if (typeof window !== 'undefined') {
  window.autoFormFiller = {
    runAutoFormFiller,
    stopAutoFill,
    checkFormStatus,
    fixValidationErrors
  };
}