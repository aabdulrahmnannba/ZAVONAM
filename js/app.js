let lastRegistration = null;

document.addEventListener("DOMContentLoaded", () => {

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const loader = $("#loader");

  setTimeout(() => loader?.classList.add("hide"), 700);


  /* =========================================================
     THEME
  ========================================================= */

  const saved = localStorage.getItem("zavonam-theme");

  if (saved === "dark") {
    document.body.classList.add("dark");
  }

  $("#themeBtn")?.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    localStorage.setItem(
      "zavonam-theme",
      document.body.classList.contains("dark")
        ? "dark"
        : "light"
    );

    $("#themeBtn").textContent =
      document.body.classList.contains("dark")
        ? "☀"
        : "☾";

  });

  if (document.body.classList.contains("dark")) {
    $("#themeBtn").textContent = "☀";
  }


  /* =========================================================
     MOBILE NAVIGATION
  ========================================================= */

  $("#menuBtn")?.addEventListener("click", () => {
    $("#nav").classList.toggle("open");
  });

  $$("#nav a").forEach(a => {

    a.addEventListener("click", () => {
      $("#nav").classList.remove("open");
    });

  });


  /* =========================================================
     COUNTDOWN
  ========================================================= */

  const target =
    new Date("2026-08-23T09:00:00+05:30").getTime();

  function countdown() {

    const diff =
      Math.max(0, target - Date.now());

    const d =
      Math.floor(diff / 86400000);

    const h =
      Math.floor(diff % 86400000 / 3600000);

    const m =
      Math.floor(diff % 3600000 / 60000);

    const s =
      Math.floor(diff % 60000 / 1000);

    if ($("#days"))
      $("#days").textContent =
        String(d).padStart(2, "0");

    if ($("#hours"))
      $("#hours").textContent =
        String(h).padStart(2, "0");

    if ($("#minutes"))
      $("#minutes").textContent =
        String(m).padStart(2, "0");

    if ($("#seconds"))
      $("#seconds").textContent =
        String(s).padStart(2, "0");

  }

  countdown();

  setInterval(countdown, 1000);


  /* =========================================================
     EVENTS
  ========================================================= */

  const grid = $("#eventGrid");

  async function getPublicEvents() {

    try {

      const {
        data,
        error
      } = await supabaseClient
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", {
          ascending: true
        });

      if (
        !error &&
        Array.isArray(data) &&
        data.length
      ) {

        return data.map(e => ({

          id: e.id,

          title: e.title,

          category:
            String(e.category || "")
              .toLowerCase(),

          icon: e.icon || "🌼",

          time: e.event_time || "",

          venue: e.venue || "",

          desc:
            e.description ||
            `Join us for ${e.title}.`,

          points: 0

        }));

      }

    } catch (err) {

      console.warn(
        "Supabase events unavailable",
        err
      );

    }


    const managed =
      JSON.parse(
        localStorage.getItem(
          "zavonam-managed-events"
        ) || "null"
      );

    if (
      Array.isArray(managed) &&
      managed.length
    ) {

      return managed.map((e, i) => ({

        id: i + 1,

        title: e.title,

        category:
          String(e.category || "")
            .toLowerCase(),

        icon: e.icon || "🌼",

        time: e.time || "",

        venue: e.venue || "",

        desc:
          e.desc ||
          `Join us for ${e.title}.`,

        points: 0

      }));

    }

    return ZAVONAM_EVENTS;

  }


  async function renderEvents(filter = "all") {

    if (!grid) return;

    const events =
      await getPublicEvents();

    grid.innerHTML =
      events
        .filter(
          e =>
            filter === "all" ||
            e.category === filter
        )
        .map(e => `

          <article class="event-card reveal">

            <div class="event-icon">
              ${e.icon}
            </div>

            <span class="event-category">
              ${e.category}
            </span>

            <h3>
              ${e.title}
            </h3>

            <p>
              ${e.desc}
            </p>

            <div class="event-meta">

              <span>
                ◷ ${e.time}
              </span>

              <span>
                📍 ${e.venue || "Venue TBA"}
              </span>

            </div>

          </article>

        `)
        .join("");

    observeReveals();

  }

  renderEvents();


  window.addEventListener(
    "storage",
    e => {

      if (
        e.key ===
        "zavonam-managed-events"
      ) {

        renderEvents(
          $$("#filters button.active")[0]
            ?.dataset.filter || "all"
        );

      }

    }
  );


  $$("#filters button")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          $$("#filters button")
            .forEach(b =>
              b.classList.remove("active")
            );

          btn.classList.add("active");

          renderEvents(
            btn.dataset.filter
          );

        }
      );

    });


  /* =========================================================
     PAYMENT UI
  ========================================================= */

  $$("#register input[name=payment]")
    .forEach(r => {

      r.addEventListener(
        "change",
        () => {

          $("#upiBox")?.classList.toggle(
            "hidden",
            r.value !== "UPI" ||
            !r.checked
          );

          $("#cashBox")?.classList.toggle(
            "hidden",
            r.value !== "Cash" ||
            !r.checked
          );

        }
      );

    });


  /* =========================================================
     REGISTRATION
  ========================================================= */

  $("#registrationForm")
    ?.addEventListener(
      "submit",
      async e => {

        e.preventDefault();

        const fd =
          new FormData(e.target);

        const form =
          Object.fromEntries(
            fd.entries()
          );

        const divisionValue =
          String(
            form.division || ""
          ).trim();


        if (
          !divisionValue
            .toLowerCase()
            .includes("second") &&
          !divisionValue
            .toLowerCase()
            .includes("2nd")
        ) {

          return alert(
            "ZAVONAM registration is only for Second Year BCA students."
          );

        }


        const data = {

          registration_id:
            "ZAV-2026-" +
            Math.random()
              .toString(36)
              .slice(2, 7)
              .toUpperCase(),

          name:
            String(form.name || "")
              .trim(),

          student_id:
            String(form.studentId || "")
              .trim(),

          mobile:
            String(form.mobile || "")
              .replace(/\D/g, ""),

          whatsapp:
            String(form.whatsapp || "")
              .replace(/\D/g, ""),

          email:
            String(form.email || "")
              .trim(),

          division:
            String(form.division || "")
              .trim(),

          payment_method:
            form.payment === "UPI"
              ? "UPI"
              : "Cash",

          payment_reference:
            String(
              form.paymentReference || ""
            ).trim(),

          payment_note:
            String(
              form.paymentNote || ""
            ).trim(),

          amount: 600,

          payment_status: "pending",

          pass_enabled: false

        };


        if (
          !data.mobile ||
          !data.whatsapp
        ) {

          return alert(
            "Please enter both Mobile Number and WhatsApp Number."
          );

        }


        const {
          data: created,
          error
        } =
          await supabaseClient
            .from("registrations")
            .insert(data)
            .select("registration_id")
            .single();


        if (error) {

          console.error(error);

          return alert(
            "Registration could not be saved to the ZAVONAM database. Please check your internet connection and try again."
          );

        }


        data.id =
          created.registration_id;

        data.status =
          "Payment Pending";

        data.passEnabled =
          false;

        data.createdAt =
          new Date().toISOString();

        lastRegistration =
          data;


        const list =
          JSON.parse(
            localStorage.getItem(
              "zavonam-registrations"
            ) || "[]"
          );

        list.push(data);

        localStorage.setItem(
          "zavonam-registrations",
          JSON.stringify(list)
        );


        $("#successMessage").textContent =
          `Your registration ${data.id} has been received. Your ${data.payment_method} payment of ₹600 is waiting for organizer verification.`;

        $("#successModal")
          ?.classList.add("show");


        e.target.reset();

        $("#upiBox")
          ?.classList.add("hidden");

        $("#cashBox")
          ?.classList.add("hidden");

      }
    );


  $("#closeModal")
    ?.addEventListener(
      "click",
      () =>
        $("#successModal")
          ?.classList.remove("show")
    );


  $("#closeSuccess")
    ?.addEventListener(
      "click",
      () =>
        $("#successModal")
          ?.classList.remove("show")
    );


  $("#successModal")
    ?.addEventListener(
      "click",
      e => {

        if (
          e.target.id ===
          "successModal"
        ) {

          $("#successModal")
            .classList.remove("show");

        }

      }
    );


  /* =========================================================
     APPROVED ENTRY PASS LOOKUP
  ========================================================= */

  $("#passLookupForm")
    ?.addEventListener(
      "submit",
      async e => {

        e.preventDefault();


        const studentId =
          $("#lookupStudentId")
            .value.trim();

        const whatsapp =
          $("#lookupWhatsapp")
            .value
            .replace(/\D/g, "");


        const box =
          $("#approvedPass");


        box.classList.remove(
          "hidden"
        );


        box.innerHTML = `

          <div class="lookup-pending">

            <b>
              Checking approval…
            </b>

            <span>
              Securely checking your ZAVONAM registration.
            </span>

          </div>

        `;


        const {
          data: found,
          error
        } =
          await supabaseClient
            .from("registrations")
            .select("*")
            .eq(
              "student_id",
              studentId
            )
            .eq(
              "whatsapp",
              whatsapp
            )
            .maybeSingle();


        if (error) {

          console.error(error);

          box.innerHTML = `

            <div class="lookup-error">

              We couldn't check the registration right now.
              Please try again.

            </div>

          `;

          return;

        }


        if (!found) {

          box.innerHTML = `

            <div class="lookup-error">

              No matching registration found.
              Please check your Student ID and WhatsApp number.

            </div>

          `;

          return;

        }


        if (
          found.payment_status !==
            "paid" ||
          found.pass_enabled !== true
        ) {

          box.innerHTML = `

            <div class="lookup-pending">

              <b>
                ⏳ Payment Verification Pending
              </b>

              <span>
                Your payment has not yet been approved by the organizer.
                Your QR code and entry pass will appear here after approval.
              </span>

            </div>

          `;

          return;

        }


        const normalized = {

          id:
            found.registration_id,

          name:
            found.name,

          studentId:
            found.student_id,

          mobile:
            found.mobile,

          whatsapp:
            found.whatsapp,

          email:
            found.email,

          division:
            found.division,

          payment:
            found.payment_method,

          status: "Paid",

          passEnabled: true,

          approvedAt:
            found.approved_at,

          createdAt:
            found.created_at

        };


        box.innerHTML = `

          <div class="approved-pass-card">

            <div>

              <p class="kicker">
                APPROVED ENTRY PASS
              </p>

              <h3>
                ${escapeHtml(
                  normalized.name
                )}
              </h3>

              <p>
                ${escapeHtml(
                  normalized.studentId
                )}
                ·
                ${escapeHtml(
                  normalized.division
                )}
              </p>

              <span class="paid-badge">
                ✓ PAYMENT APPROVED · ₹600
              </span>

            </div>


            <div
              class="approved-qr"
              id="approvedQr"
            ></div>


            <div class="pass-code">
              ${escapeHtml(
                normalized.id
              )}
            </div>


            <div class="approved-actions">

              <button
                class="btn btn-primary"
                id="downloadApprovedPdf"
              >
                Download Pass + Bill PDF
              </button>

              <a
                class="btn btn-outline"
                id="approvedWhatsApp"
                target="_blank"
                rel="noopener"
              >
                WhatsApp
              </a>

              <button
                class="btn btn-outline"
                id="copyApprovedMessage"
                type="button"
              >
                Copy Message
              </button>

            </div>

          </div>

        `;


        if (window.QRCode) {

          new QRCode(
            document.getElementById(
              "approvedQr"
            ),
            {

              text:
                JSON.stringify({

                  registrationId:
                    normalized.id,

                  name:
                    normalized.name,

                  studentId:
                    normalized.studentId,

                  status:
                    "APPROVED"

                }),

              width: 180,

              height: 180,

              colorDark:
                "#173b2a",

              colorLight:
                "#ffffff",

              correctLevel:
                QRCode.CorrectLevel.M

            }
          );

        }


        $("#approvedWhatsApp").href =
          `https://wa.me/91${String(
            normalized.whatsapp
          ).replace(/\D/g, "")}?text=${encodeURIComponent(
            `🌼 ZAVONAM 2026
Hi ${normalized.name}, your payment has been approved. Your Entry Pass is now available on the ZAVONAM website. Registration ID: ${normalized.id}`
          )}`;


        $("#copyApprovedMessage")
          ?.addEventListener(
            "click",
            async () => {

              const msg =
                `🌼 ZAVONAM 2026
Hi ${normalized.name}, your ₹600 payment has been approved.
Registration ID: ${normalized.id}
Your approved Entry Pass is now available on the ZAVONAM website.
Please download the Pass + Bill PDF and keep it ready for entry.`;

              try {

                await navigator.clipboard
                  .writeText(msg);

                alert(
                  "WhatsApp message copied."
                );

              } catch (err) {

                prompt(
                  "Copy this WhatsApp message:",
                  msg
                );

              }

            }
          );


        $("#downloadApprovedPdf")
          .onclick = () =>
            generateApprovedPdf(
              normalized
            );

      }
    );


  /* =========================================================
     APPROVED PASS PDF
  ========================================================= */

  function generateApprovedPdf(pass) {

    if (
      !window.jspdf?.jsPDF
    ) {

      return alert(
        "PDF library is not available. Please check your internet connection and try again."
      );

    }


    const {
      jsPDF
    } = window.jspdf;


    const doc =
      new jsPDF({
        unit: "mm",
        format: "a4"
      });


    const W = 210;

    const H = 297;


    const green =
      [23, 59, 42];

    const gold =
      [198, 151, 62];

    const cream =
      [248, 245, 235];

    const dark =
      [28, 31, 29];

    const muted =
      [103, 106, 101];


    /* PAGE 1 — ENTRY PASS */

    doc.setFillColor(
      ...cream
    );

    doc.rect(
      0,
      0,
      W,
      H,
      "F"
    );


    doc.setFillColor(
      ...green
    );

    doc.rect(
      0,
      0,
      W,
      18,
      "F"
    );


    doc.setTextColor(
      255,
      255,
      255
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(10);


    doc.text(
      "SRINIVAS UNIVERSITY  •  SECOND YEAR BCA",
      15,
      11
    );


    doc.setTextColor(
      ...dark
    );

    doc.setFontSize(30);

    doc.text(
      "ZAVONAM",
      15,
      43
    );


    doc.setFontSize(11);

    doc.setTextColor(
      ...gold
    );

    doc.text(
      "2026 ONAM CELEBRATION",
      15,
      51
    );


    doc.setDrawColor(
      ...gold
    );

    doc.setLineWidth(.5);

    doc.line(
      15,
      58,
      195,
      58
    );


    doc.setTextColor(
      ...muted
    );

    doc.setFontSize(9);

    doc.text(
      "APPROVED ENTRY PASS",
      15,
      69
    );


    doc.setTextColor(
      ...dark
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(21);

    doc.text(
      String(
        pass.name || ""
      ).slice(0, 35),
      15,
      82
    );


    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(11);

    doc.text(
      `Student ID: ${pass.studentId || "-"}`,
      15,
      91
    );

    doc.text(
      `Division: ${pass.division || "-"}`,
      15,
      99
    );

    doc.text(
      `Registration ID: ${pass.id || "-"}`,
      15,
      107
    );

    doc.text(
      "Payment: APPROVED  •  ₹600",
      15,
      115
    );


    const qrCanvas =
      document.querySelector(
        "#approvedQr canvas"
      );


    if (qrCanvas) {

      const data =
        qrCanvas.toDataURL(
          "image/png"
        );

      doc.setFillColor(
        255,
        255,
        255
      );

      doc.roundedRect(
        130,
        68,
        58,
        58,
        4,
        4,
        "F"
      );

      doc.addImage(
        data,
        "PNG",
        135,
        73,
        48,
        48
      );

    }


    doc.setDrawColor(
      ...gold
    );

    doc.roundedRect(
      15,
      132,
      180,
      56,
      5,
      5,
      "S"
    );


    doc.setTextColor(
      ...dark
    );

    doc.setFontSize(10);

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.text(
      "ENTRY INSTRUCTIONS",
      23,
      145
    );


    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.setTextColor(
      ...muted
    );

    doc.text(
      "• Present this approved pass at the event entry.",
      23,
      155
    );

    doc.text(
      "• QR code is valid only after organizer approval.",
      23,
      164
    );

    doc.text(
      "• Keep this PDF available on your phone.",
      23,
      173
    );


    doc.setFillColor(
      ...green
    );

    doc.rect(
      0,
      278,
      W,
      19,
      "F"
    );


    doc.setTextColor(
      255,
      255,
      255
    );

    doc.setFontSize(9);

    doc.text(
      "23 AUGUST 2026  •  ZAVONAM  •  SRINIVAS UNIVERSITY",
      15,
      289
    );


    /* PAGE 2 — PAYMENT RECEIPT */

    doc.addPage();


    doc.setFillColor(
      ...cream
    );

    doc.rect(
      0,
      0,
      W,
      H,
      "F"
    );


    doc.setFillColor(
      ...green
    );

    doc.rect(
      0,
      0,
      W,
      18,
      "F"
    );


    doc.setTextColor(
      255,
      255,
      255
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(10);

    doc.text(
      "ZAVONAM 2026  •  PAYMENT RECEIPT",
      15,
      11
    );


    doc.setTextColor(
      ...dark
    );

    doc.setFontSize(24);

    doc.text(
      "Payment Bill",
      15,
      42
    );


    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.setTextColor(
      ...muted
    );

    doc.text(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      15,
      51
    );


    doc.setDrawColor(
      ...gold
    );

    doc.line(
      15,
      58,
      195,
      58
    );


    const rows = [

      [
        "Registration ID",
        pass.id || "-"
      ],

      [
        "Student Name",
        pass.name || "-"
      ],

      [
        "Student ID",
        pass.studentId || "-"
      ],

      [
        "Mobile",
        pass.mobile || "-"
      ],

      [
        "WhatsApp",
        pass.whatsapp || "-"
      ],

      [
        "Division",
        pass.division || "-"
      ],

      [
        "Payment Method",
        pass.payment || "-"
      ],

      [
        "Payment Status",
        "APPROVED / PAID"
      ],

      [
        "Event Fee",
        "₹600"
      ]

    ];


    let y = 72;


    rows.forEach(
      ([label, value]) => {

        doc.setTextColor(
          ...muted
        );

        doc.setFontSize(9);

        doc.text(
          label,
          18,
          y
        );


        doc.setTextColor(
          ...dark
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(10);

        doc.text(
          String(value).slice(
            0,
            55
          ),
          92,
          y
        );


        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setDrawColor(
          225,
          220,
          207
        );

        doc.line(
          15,
          y + 5,
          195,
          y + 5
        );


        y += 15;

      }
    );


    doc.setFillColor(
      ...green
    );

    doc.roundedRect(
      15,
      y + 8,
      180,
      27,
      4,
      4,
      "F"
    );


    doc.setTextColor(
      255,
      255,
      255
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(14);

    doc.text(
      "TOTAL PAID",
      23,
      y + 25
    );

    doc.text(
      "₹600",
      166,
      y + 25
    );


    doc.setTextColor(
      ...muted
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.text(
      "This bill is generated for the approved ZAVONAM 2026 event registration.",
      15,
      185
    );

    doc.text(
      "For verification, quote the Registration ID to the event organizers.",
      15,
      193
    );


    doc.setFillColor(
      ...green
    );

    doc.rect(
      0,
      278,
      W,
      19,
      "F"
    );


    doc.setTextColor(
      255,
      255,
      255
    );

    doc.setFontSize(9);

    doc.text(
      "@zevix.bca  •  Second Year BCA  •  Srinivas University",
      15,
      289
    );


    doc.save(
      `ZAVONAM-2026-${String(
        pass.id || "PASS"
      ).replace(
        /[^a-z0-9_-]/gi,
        ""
      )}.pdf`
    );

  }


  /* =========================================================
     HTML ESCAPE
  ========================================================= */

  function escapeHtml(s) {

    return String(
      s ?? ""
    ).replace(
      /[&<>"']/g,
      c => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

      }[c])
    );

  }


  /* =========================================================
     SCROLL REVEAL
  ========================================================= */

  function observeReveals() {

    const io =
      new IntersectionObserver(
        entries =>
          entries.forEach(
            x => {

              if (
                x.isIntersecting
              ) {

                x.target.classList.add(
                  "visible"
                );

                io.unobserve(
                  x.target
                );

              }

            }
          ),
        {
          threshold: .12
        }
      );


    $$(".reveal:not(.visible)")
      .forEach(
        el =>
          io.observe(el)
      );

  }

  observeReveals();


  /* =========================================================
     PUBLIC ANNOUNCEMENTS
  ========================================================= */

  async function renderPublicAnnouncements() {

    const box =
      document.getElementById(
        "announcementText"
      );

    const section =
      document.getElementById(
        "liveAnnouncements"
      );


    if (
      !box ||
      !section
    ) return;


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("announcements")
          .select(
            "message,created_at"
          )
          .eq(
            "is_active",
            true
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )
          .limit(1);


      if (
        !error &&
        data?.length
      ) {

        box.textContent =
          data[0].message;

        return;

      }

    } catch (err) {

      console.warn(
        "Supabase announcements unavailable",
        err
      );

    }


    const notices =
      JSON.parse(
        localStorage.getItem(
          "zavonam-notices"
        ) || "[]"
      );


    box.textContent =
      notices.length
        ? notices[0]
        : "No new announcements.";

  }


  renderPublicAnnouncements();


  window.addEventListener(
    "storage",
    renderPublicAnnouncements
  );


  /* =========================================================
     PUBLIC GALLERY
     VIEW + HD DOWNLOAD
  ========================================================= */

  async function renderPublicGallery() {

    const gallery =
      document.querySelector(
        ".gallery"
      );


    if (!gallery) return;


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("gallery")
          .select(
            "id,title,image_url,image_path,sort_order,created_at"
          )
          .eq(
            "is_active",
            true
          )
          .order(
            "sort_order",
            {
              ascending: true
            }
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (error) {

        console.error(
          "Public gallery error:",
          error
        );

        return;

      }


      if (
        !Array.isArray(data) ||
        !data.length
      ) {

        return;

      }


      window.zavonamGallery =
        data;


      gallery.innerHTML =
        data.map(
          (g, index) => `

            <figure
              class="gallery-tile live-gallery-tile"
            >

              <div
                class="gallery-image-box"
              >

                <img
                  src="${g.image_url}"
                  alt="${escapeHtml(
                    g.title ||
                    "ZAVONAM Photo"
                  )}"
                  loading="lazy"
                >

              </div>


              <figcaption>

                ${escapeHtml(
                  g.title ||
                  `ZAVONAM Photo ${index + 1}`
                )}

              </figcaption>


              <div
                class="gallery-actions"
              >

                <button
                  type="button"
                  onclick="viewGalleryImage(${index})"
                >
                  View
                </button>


                <button
                  type="button"
                  onclick="downloadGalleryImage(${index})"
                >
                  Download HD
                </button>

              </div>

            </figure>

          `
        ).join("");


    } catch (err) {

      console.error(
        "Supabase gallery unavailable:",
        err
      );

    }

  }


  renderPublicGallery();


  /* =========================================================
     GALLERY VIEWER
  ========================================================= */

  window.viewGalleryImage =
    function(index) {

      const item =
        window.zavonamGallery?.[
          index
        ];


      if (
        !item ||
        !item.image_url
      ) {

        alert(
          "Image not available."
        );

        return;

      }


      const overlay =
        document.createElement(
          "div"
        );


      overlay.id =
        "galleryViewer";


      overlay.innerHTML = `

        <div
          class="gallery-viewer-bg"
        >

          <button
            class="gallery-viewer-close"
            type="button"
          >
            ×
          </button>


          <img
            src="${item.image_url}"
            alt="${escapeHtml(
              item.title ||
              "ZAVONAM Photo"
            )}"
          >


          <div
            class="gallery-viewer-title"
          >
            ${escapeHtml(
              item.title ||
              "ZAVONAM Photo"
            )}
          </div>

        </div>

      `;


      document.body.appendChild(
        overlay
      );


      document.body.style.overflow =
        "hidden";


      overlay
        .querySelector(
          ".gallery-viewer-close"
        )
        .onclick = () => {

          overlay.remove();

          document.body.style.overflow =
            "";

        };


      overlay.onclick = e => {

        if (
          e.target === overlay
        ) {

          overlay.remove();

          document.body.style.overflow =
            "";

        }

      };

    };


  /* =========================================================
     GALLERY HD DOWNLOAD
  ========================================================= */

  window.downloadGalleryImage =
    async function(index) {

      const item =
        window.zavonamGallery?.[
          index
        ];


      if (
        !item ||
        !item.image_url
      ) {

        alert(
          "Image not available."
        );

        return;

      }


      try {

        const response =
          await fetch(
            item.image_url
          );


        if (!response.ok) {

          throw new Error(
            "Could not download image."
          );

        }


        const blob =
          await response.blob();


        const url =
          URL.createObjectURL(
            blob
          );


        const filename =
          (
            item.title ||
            "ZAVONAM-Photo"
          )
            .replace(
              /[^a-z0-9-_]/gi,
              "-"
            )
          + ".jpg";


        const a =
          document.createElement(
            "a"
          );


        a.href = url;

        a.download =
          filename;


        document.body.appendChild(
          a
        );


        a.click();


        a.remove();


        URL.revokeObjectURL(
          url
        );


      } catch (error) {

        console.error(
          "Download error:",
          error
        );


        /*
          Fallback:
          Open original Supabase image
          in a new tab.
        */

        window.open(
          item.image_url,
          "_blank"
        );

      }

    };


  /* =========================================================
     BACK TO TOP
  ========================================================= */

  const top =
    $("#topBtn");


  if (top) {

    window.addEventListener(
      "scroll",
      () =>
        top.classList.toggle(
          "show",
          scrollY > 500
        )
    );


    top.addEventListener(
      "click",
      () =>
        scrollTo({
          top: 0,
          behavior: "smooth"
        })
    );

  }

});