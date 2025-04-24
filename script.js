async function convertFile() {
  const fileInput = document.getElementById("fileInput");
  const format = document.getElementById("formatSelect").value;
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "";

  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file.");
    return;
  }

  const fileType = file.type;

  if (fileType === "application/pdf" && format !== "pdf") {
    convertPdfToImageZip(file, format, outputDiv);
  } else {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        if (format === "pdf") {
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({
            orientation: img.width > img.height ? "landscape" : "portrait",
            unit: "pt",
            format: [img.width, img.height]
          });

          const imgData = canvas.toDataURL("image/jpeg", 1.0);
          pdf.addImage(imgData, "JPEG", 0, 0, img.width, img.height);
          const blob = pdf.output("blob");
          const url = URL.createObjectURL(blob);
          createDownloadLink(url, "converted.pdf", outputDiv);
        } else {
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const filename = `converted.${format}`;
            createDownloadLink(url, filename, outputDiv);
          }, `image/${format}`);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function convertPdfToImageZip(file, format, container) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const zip = new JSZip();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, `image/${format}`)
    );
    zip.file(`page${i}.${format}`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  createDownloadLink(url, "converted_images.zip", container);
}

function createDownloadLink(url, filename, container) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.textContent = `Download ${filename}`;
  link.className = "download-link";
  container.appendChild(link);
}