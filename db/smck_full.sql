--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: divisi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.divisi (
    id integer NOT NULL,
    nama character varying(100) NOT NULL,
    deskripsi text,
    ketua_id integer,
    max_persen_cuti integer DEFAULT 10 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT divisi_max_persen_cuti_check CHECK (((max_persen_cuti >= 0) AND (max_persen_cuti <= 100)))
);


--
-- Name: divisi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.divisi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: divisi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.divisi_id_seq OWNED BY public.divisi.id;


--
-- Name: hari_libur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hari_libur (
    id integer NOT NULL,
    tanggal date NOT NULL,
    keterangan character varying(150) NOT NULL,
    jenis character varying(20) DEFAULT 'nasional'::character varying NOT NULL,
    CONSTRAINT hari_libur_jenis_check CHECK (((jenis)::text = ANY ((ARRAY['nasional'::character varying, 'cuti_bersama'::character varying])::text[])))
);


--
-- Name: hari_libur_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hari_libur_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hari_libur_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hari_libur_id_seq OWNED BY public.hari_libur.id;


--
-- Name: jenis_cuti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jenis_cuti (
    id integer NOT NULL,
    nama character varying(100) NOT NULL,
    kode character varying(20),
    is_system boolean DEFAULT false NOT NULL,
    kuota_hari numeric(5,1),
    batas_pengajuan_hari integer DEFAULT 0 NOT NULL,
    wajib_lampiran boolean DEFAULT false NOT NULL,
    potong_kuota boolean DEFAULT false NOT NULL,
    aktif boolean DEFAULT true NOT NULL,
    CONSTRAINT jenis_cuti_kode_check CHECK (((kode)::text = ANY ((ARRAY['tahunan'::character varying, 'sakit'::character varying])::text[])))
);


--
-- Name: jenis_cuti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jenis_cuti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jenis_cuti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jenis_cuti_id_seq OWNED BY public.jenis_cuti.id;


--
-- Name: lampiran; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lampiran (
    id integer NOT NULL,
    pengajuan_id integer,
    diunggah_oleh integer,
    nama_asli character varying(200) NOT NULL,
    mime character varying(50) NOT NULL,
    ukuran integer NOT NULL,
    storage_key character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lampiran_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lampiran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lampiran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lampiran_id_seq OWNED BY public.lampiran.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tipe character varying(30) NOT NULL,
    pesan text NOT NULL,
    link character varying(200),
    dibaca boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: pengajuan_cuti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pengajuan_cuti (
    id integer NOT NULL,
    pengaju_id integer NOT NULL,
    divisi_id integer,
    jenis_id integer NOT NULL,
    tanggal_pengajuan date DEFAULT CURRENT_DATE NOT NULL,
    tanggal_mulai date NOT NULL,
    tanggal_selesai date NOT NULL,
    setengah_hari boolean DEFAULT false NOT NULL,
    total_hari numeric(4,1) NOT NULL,
    alasan text NOT NULL,
    handover_id integer,
    catatan_tugas text,
    alamat_cuti text,
    nomor_darurat character varying(30),
    status character varying(20) NOT NULL,
    tahap character varying(10) NOT NULL,
    ditolak_oleh character varying(10),
    alasan_batal text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pengajuan_cuti_check CHECK ((tanggal_selesai >= tanggal_mulai)),
    CONSTRAINT pengajuan_cuti_check1 CHECK (((NOT setengah_hari) OR (tanggal_mulai = tanggal_selesai))),
    CONSTRAINT pengajuan_cuti_ditolak_oleh_check CHECK (((ditolak_oleh)::text = ANY ((ARRAY['leader'::character varying, 'hrd'::character varying])::text[]))),
    CONSTRAINT pengajuan_cuti_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved by Leader'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT pengajuan_cuti_tahap_check CHECK (((tahap)::text = ANY ((ARRAY['leader'::character varying, 'hrd'::character varying])::text[])))
);


--
-- Name: pengajuan_cuti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pengajuan_cuti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pengajuan_cuti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pengajuan_cuti_id_seq OWNED BY public.pengajuan_cuti.id;


--
-- Name: pengaturan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pengaturan (
    key character varying(50) NOT NULL,
    value character varying(200) NOT NULL
);


--
-- Name: persetujuan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persetujuan (
    id integer NOT NULL,
    pengajuan_id integer NOT NULL,
    tahap character varying(10) NOT NULL,
    approver_id integer NOT NULL,
    keputusan character varying(10) NOT NULL,
    catatan text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT persetujuan_keputusan_check CHECK (((keputusan)::text = ANY ((ARRAY['approve'::character varying, 'reject'::character varying])::text[]))),
    CONSTRAINT persetujuan_tahap_check CHECK (((tahap)::text = ANY ((ARRAY['leader'::character varying, 'hrd'::character varying])::text[])))
);


--
-- Name: persetujuan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.persetujuan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: persetujuan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.persetujuan_id_seq OWNED BY public.persetujuan.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(100) NOT NULL,
    nama_lengkap character varying(100) NOT NULL,
    telepon character varying(30),
    alamat text,
    foto_key character varying(100),
    role character varying(20) NOT NULL,
    divisi_id integer,
    tanggal_bergabung date NOT NULL,
    kuota_awal numeric(4,1) DEFAULT 12 NOT NULL,
    aktif boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'karyawan'::character varying, 'ketua_divisi'::character varying, 'hrd'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: divisi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.divisi ALTER COLUMN id SET DEFAULT nextval('public.divisi_id_seq'::regclass);


--
-- Name: hari_libur id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hari_libur ALTER COLUMN id SET DEFAULT nextval('public.hari_libur_id_seq'::regclass);


--
-- Name: jenis_cuti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jenis_cuti ALTER COLUMN id SET DEFAULT nextval('public.jenis_cuti_id_seq'::regclass);


--
-- Name: lampiran id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lampiran ALTER COLUMN id SET DEFAULT nextval('public.lampiran_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: pengajuan_cuti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan_cuti ALTER COLUMN id SET DEFAULT nextval('public.pengajuan_cuti_id_seq'::regclass);


--
-- Name: persetujuan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persetujuan ALTER COLUMN id SET DEFAULT nextval('public.persetujuan_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: divisi; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.divisi (id, nama, deskripsi, ketua_id, max_persen_cuti, created_at, deleted_at) VALUES (1, 'CPC', 'Cash Processing Center: penyortir dan penghitung uang', 3, 25, '2026-11-09 21:25:15.741833+00', NULL);
INSERT INTO public.divisi (id, nama, deskripsi, ketua_id, max_persen_cuti, created_at, deleted_at) VALUES (2, 'CIT', 'Cash in Transit: pengawalan dan pengiriman uang', 4, 25, '2026-11-09 21:25:15.74342+00', NULL);
INSERT INTO public.divisi (id, nama, deskripsi, ketua_id, max_persen_cuti, created_at, deleted_at) VALUES (3, 'FLM', 'First Line Maintenance: perbaikan ringan dan pengisian kaset ATM', 5, 34, '2026-11-09 21:25:15.744673+00', NULL);


--
-- Data for Name: hari_libur; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hari_libur (id, tanggal, keterangan, jenis) VALUES (1, '2026-01-01', 'Tahun Baru 2026', 'nasional');
INSERT INTO public.hari_libur (id, tanggal, keterangan, jenis) VALUES (2, '2026-05-01', 'Hari Buruh', 'nasional');
INSERT INTO public.hari_libur (id, tanggal, keterangan, jenis) VALUES (3, '2026-06-01', 'Hari Lahir Pancasila', 'nasional');
INSERT INTO public.hari_libur (id, tanggal, keterangan, jenis) VALUES (4, '2026-08-17', 'Hari Kemerdekaan RI', 'nasional');
INSERT INTO public.hari_libur (id, tanggal, keterangan, jenis) VALUES (5, '2026-12-24', 'Cuti Bersama Natal', 'cuti_bersama');
INSERT INTO public.hari_libur (id, tanggal, keterangan, jenis) VALUES (6, '2026-12-25', 'Hari Natal', 'nasional');


--
-- Data for Name: jenis_cuti; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.jenis_cuti (id, nama, kode, is_system, kuota_hari, batas_pengajuan_hari, wajib_lampiran, potong_kuota, aktif) VALUES (1, 'Cuti Tahunan', 'tahunan', true, NULL, 3, false, true, true);
INSERT INTO public.jenis_cuti (id, nama, kode, is_system, kuota_hari, batas_pengajuan_hari, wajib_lampiran, potong_kuota, aktif) VALUES (2, 'Cuti Sakit', 'sakit', true, NULL, -3, true, false, true);
INSERT INTO public.jenis_cuti (id, nama, kode, is_system, kuota_hari, batas_pengajuan_hari, wajib_lampiran, potong_kuota, aktif) VALUES (3, 'Cuti Menikah', NULL, false, 3.0, 7, true, false, true);
INSERT INTO public.jenis_cuti (id, nama, kode, is_system, kuota_hari, batas_pengajuan_hari, wajib_lampiran, potong_kuota, aktif) VALUES (4, 'Cuti Duka', NULL, false, 2.0, 0, false, false, true);


--
-- Data for Name: lampiran; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.lampiran (id, pengajuan_id, diunggah_oleh, nama_asli, mime, ukuran, storage_key, created_at) VALUES (1, 9, NULL, 'surat-dokter-contoh.pdf', 'application/pdf', 500, 'surat-dokter-contoh.pdf', '2026-11-09 21:25:15.783041+00');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, user_id, tipe, pesan, link, dibaca, created_at) VALUES (1, 17, 'handover', 'Anda ditunjuk sebagai rekan pengganti Ana Rahma pada 18 Nov 2026', '/cuti', false, '2026-11-09 21:25:15.783781+00');


--
-- Data for Name: pengajuan_cuti; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (1, 14, 3, 1, '2026-11-09', '2026-11-18', '2026-11-18', false, 1.0, 'Urusan keluarga', 17, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Approved', 'hrd', NULL, NULL, '2026-11-09 21:25:15.768345+00');
INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (2, 15, 3, 1, '2026-11-09', '2026-11-18', '2026-11-18', false, 1.0, 'Keperluan pribadi', 16, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Approved by Leader', 'hrd', NULL, NULL, '2026-11-09 21:25:15.771748+00');
INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (3, 6, 1, 1, '2026-11-09', '2026-12-07', '2026-12-09', false, 3.0, 'Liburan akhir tahun', 9, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Pending', 'leader', NULL, NULL, '2026-11-09 21:25:15.773648+00');
INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (4, 4, 2, 1, '2026-11-09', '2026-11-09', '2026-11-13', false, 5.0, 'Cuti keluarga', 12, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Approved', 'hrd', NULL, NULL, '2026-11-09 21:25:15.774916+00');
INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (5, 3, 1, 1, '2026-11-09', '2026-12-14', '2026-12-16', false, 3.0, 'Acara keluarga', 7, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Pending', 'hrd', NULL, NULL, '2026-11-09 21:25:15.776271+00');
INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (6, 10, 2, 1, '2026-11-09', '2026-11-23', '2026-11-25', false, 3.0, 'Perjalanan', 13, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Rejected', 'leader', 'leader', NULL, '2026-11-09 21:25:15.777072+00');
INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (7, 8, 1, 1, '2026-11-09', '2026-11-30', '2026-12-02', false, 3.0, 'Liburan', 9, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Rejected', 'hrd', 'hrd', NULL, '2026-11-09 21:25:15.778462+00');
INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (8, 11, 2, 1, '2026-11-09', '2026-12-01', '2026-12-01', false, 1.0, 'Keperluan', 12, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Cancelled', 'leader', NULL, 'Rencana berubah', '2026-11-09 21:25:15.78074+00');
INSERT INTO public.pengajuan_cuti (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status, tahap, ditolak_oleh, alasan_batal, created_at) VALUES (9, 7, 1, 2, '2026-11-09', '2026-11-02', '2026-11-03', false, 2.0, 'Demam tinggi', 6, 'Serah terima tugas harian', 'Makassar', '08120000000', 'Approved', 'hrd', NULL, NULL, '2026-11-09 21:25:15.781415+00');


--
-- Data for Name: pengaturan; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pengaturan (key, value) VALUES ('ambang_kuota_hangus', '8');
INSERT INTO public.pengaturan (key, value) VALUES ('bulan_mulai_peringatan', '9');


--
-- Data for Name: persetujuan; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (1, 1, 'leader', 5, 'approve', NULL, '2026-11-09 21:25:15.769514+00');
INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (2, 1, 'hrd', 2, 'approve', 'Disetujui', '2026-11-09 21:25:15.770845+00');
INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (3, 2, 'leader', 5, 'approve', 'Silakan', '2026-11-09 21:25:15.772847+00');
INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (4, 4, 'hrd', 2, 'approve', NULL, '2026-11-09 21:25:15.775705+00');
INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (5, 6, 'leader', 4, 'reject', 'Jadwal pengawalan padat pada tanggal tersebut', '2026-11-09 21:25:15.777821+00');
INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (6, 7, 'leader', 3, 'approve', NULL, '2026-11-09 21:25:15.779128+00');
INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (7, 7, 'hrd', 2, 'reject', 'Bertepatan dengan penutupan periode', '2026-11-09 21:25:15.779644+00');
INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (8, 9, 'leader', 3, 'approve', NULL, '2026-11-09 21:25:15.78203+00');
INSERT INTO public.persetujuan (id, pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES (9, 9, 'hrd', 2, 'approve', NULL, '2026-11-09 21:25:15.782583+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (1, 'admin', 'admin@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Admin Sistem', '0811000000', 'Makassar', NULL, 'admin', NULL, '2020-01-01', 12.0, true, NULL, '2026-11-09 21:25:15.736716+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (2, 'hrd', 'hrd@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Hesti HRD', '0811000000', 'Makassar', NULL, 'hrd', NULL, '2020-03-01', 12.0, true, NULL, '2026-11-09 21:25:15.738428+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (3, 'ketua.cpc', 'ketua.cpc@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Kirana Ketua CPC', '0811000000', 'Makassar', NULL, 'ketua_divisi', 1, '2019-05-01', 12.0, true, NULL, '2026-11-09 21:25:15.739363+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (4, 'ketua.cit', 'ketua.cit@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Kurnia Ketua CIT', '0811000000', 'Makassar', NULL, 'ketua_divisi', 2, '2019-06-01', 12.0, true, NULL, '2026-11-09 21:25:15.740133+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (5, 'ketua.flm', 'ketua.flm@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Kartono Ketua FLM', '0811000000', 'Makassar', NULL, 'ketua_divisi', 3, '2019-07-01', 12.0, true, NULL, '2026-11-09 21:25:15.740943+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (6, 'eka', 'eka@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Eka Putri', '0811000000', 'Makassar', NULL, 'karyawan', 1, '2022-02-01', 12.0, true, NULL, '2026-11-09 21:25:15.749302+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (7, 'hana', 'hana@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Hana Lestari', '0811000000', 'Makassar', NULL, 'karyawan', 1, '2021-08-01', 12.0, true, NULL, '2026-11-09 21:25:15.750632+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (8, 'ivan', 'ivan@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Ivan Saputra', '0811000000', 'Makassar', NULL, 'karyawan', 1, '2023-01-10', 12.0, true, NULL, '2026-11-09 21:25:15.751936+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (9, 'joko', 'joko@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Joko Santoso', '0811000000', 'Makassar', NULL, 'karyawan', 1, '2022-09-05', 12.0, true, NULL, '2026-11-09 21:25:15.753785+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (10, 'fajar', 'fajar@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Fajar Nugraha', '0811000000', 'Makassar', NULL, 'karyawan', 2, '2022-04-01', 12.0, true, NULL, '2026-11-09 21:25:15.755338+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (11, 'gita', 'gita@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Gita Permata', '0811000000', 'Makassar', NULL, 'karyawan', 2, '2023-03-15', 12.0, true, NULL, '2026-11-09 21:25:15.756775+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (12, 'lani', 'lani@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Lani Marlina', '0811000000', 'Makassar', NULL, 'karyawan', 2, '2021-11-01', 12.0, true, NULL, '2026-11-09 21:25:15.758174+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (13, 'mirza', 'mirza@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Mirza Akbar', '0811000000', 'Makassar', NULL, 'karyawan', 2, '2022-12-01', 12.0, true, NULL, '2026-11-09 21:25:15.759719+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (14, 'ana', 'ana@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Ana Rahma', '0811000000', 'Makassar', NULL, 'karyawan', 3, '2022-01-03', 12.0, true, NULL, '2026-11-09 21:25:15.760987+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (15, 'dedi', 'dedi@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Dedi Kurniawan', '0811000000', 'Makassar', NULL, 'karyawan', 3, '2021-06-01', 12.0, true, NULL, '2026-11-09 21:25:15.762497+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (16, 'budi', 'budi@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Budi Hartono', '0811000000', 'Makassar', NULL, 'karyawan', 3, '2020-02-01', 12.0, true, NULL, '2026-11-09 21:25:15.763871+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (17, 'cici', 'cici@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Cici Amelia', '0811000000', 'Makassar', NULL, 'karyawan', 3, '2023-05-01', 12.0, true, NULL, '2026-11-09 21:25:15.764977+00');
INSERT INTO public.users (id, username, email, password_hash, nama_lengkap, telepon, alamat, foto_key, role, divisi_id, tanggal_bergabung, kuota_awal, aktif, deleted_at, created_at) VALUES (18, 'rina', 'rina@ssi.co.id', '$2b$10$cyAO.KL/ymArUfgWkitRmOx0gT8rqpi1U.M7Jy74ac1K/MbVXw9Xa', 'Rina Karyawan Baru', '0811000000', 'Makassar', NULL, 'karyawan', 3, '2026-06-01', 12.0, true, NULL, '2026-11-09 21:25:15.766007+00');


--
-- Name: divisi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.divisi_id_seq', 3, true);


--
-- Name: hari_libur_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hari_libur_id_seq', 6, true);


--
-- Name: jenis_cuti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jenis_cuti_id_seq', 4, true);


--
-- Name: lampiran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lampiran_id_seq', 1, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: pengajuan_cuti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pengajuan_cuti_id_seq', 9, true);


--
-- Name: persetujuan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.persetujuan_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: divisi divisi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.divisi
    ADD CONSTRAINT divisi_pkey PRIMARY KEY (id);


--
-- Name: hari_libur hari_libur_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hari_libur
    ADD CONSTRAINT hari_libur_pkey PRIMARY KEY (id);


--
-- Name: hari_libur hari_libur_tanggal_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hari_libur
    ADD CONSTRAINT hari_libur_tanggal_key UNIQUE (tanggal);


--
-- Name: jenis_cuti jenis_cuti_kode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jenis_cuti
    ADD CONSTRAINT jenis_cuti_kode_key UNIQUE (kode);


--
-- Name: jenis_cuti jenis_cuti_nama_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jenis_cuti
    ADD CONSTRAINT jenis_cuti_nama_key UNIQUE (nama);


--
-- Name: jenis_cuti jenis_cuti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jenis_cuti
    ADD CONSTRAINT jenis_cuti_pkey PRIMARY KEY (id);


--
-- Name: lampiran lampiran_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lampiran
    ADD CONSTRAINT lampiran_pkey PRIMARY KEY (id);


--
-- Name: lampiran lampiran_storage_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lampiran
    ADD CONSTRAINT lampiran_storage_key_key UNIQUE (storage_key);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pengajuan_cuti pengajuan_cuti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan_cuti
    ADD CONSTRAINT pengajuan_cuti_pkey PRIMARY KEY (id);


--
-- Name: pengaturan pengaturan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengaturan
    ADD CONSTRAINT pengaturan_pkey PRIMARY KEY (key);


--
-- Name: persetujuan persetujuan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persetujuan
    ADD CONSTRAINT persetujuan_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: divisi_ketua_aktif; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX divisi_ketua_aktif ON public.divisi USING btree (ketua_id) WHERE ((deleted_at IS NULL) AND (ketua_id IS NOT NULL));


--
-- Name: divisi_nama_aktif; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX divisi_nama_aktif ON public.divisi USING btree (lower((nama)::text)) WHERE (deleted_at IS NULL);


--
-- Name: notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user ON public.notifications USING btree (user_id, dibaca);


--
-- Name: pengajuan_divisi_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pengajuan_divisi_status ON public.pengajuan_cuti USING btree (divisi_id, status);


--
-- Name: pengajuan_pengaju; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pengajuan_pengaju ON public.pengajuan_cuti USING btree (pengaju_id);


--
-- Name: pengajuan_rentang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pengajuan_rentang ON public.pengajuan_cuti USING btree (tanggal_mulai, tanggal_selesai);


--
-- Name: users_email_aktif; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_aktif ON public.users USING btree (lower((email)::text)) WHERE (deleted_at IS NULL);


--
-- Name: users_username_aktif; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_aktif ON public.users USING btree (lower((username)::text)) WHERE (deleted_at IS NULL);


--
-- Name: divisi divisi_ketua_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.divisi
    ADD CONSTRAINT divisi_ketua_id_fkey FOREIGN KEY (ketua_id) REFERENCES public.users(id);


--
-- Name: lampiran lampiran_diunggah_oleh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lampiran
    ADD CONSTRAINT lampiran_diunggah_oleh_fkey FOREIGN KEY (diunggah_oleh) REFERENCES public.users(id);


--
-- Name: lampiran lampiran_pengajuan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lampiran
    ADD CONSTRAINT lampiran_pengajuan_id_fkey FOREIGN KEY (pengajuan_id) REFERENCES public.pengajuan_cuti(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pengajuan_cuti pengajuan_cuti_divisi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan_cuti
    ADD CONSTRAINT pengajuan_cuti_divisi_id_fkey FOREIGN KEY (divisi_id) REFERENCES public.divisi(id);


--
-- Name: pengajuan_cuti pengajuan_cuti_handover_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan_cuti
    ADD CONSTRAINT pengajuan_cuti_handover_id_fkey FOREIGN KEY (handover_id) REFERENCES public.users(id);


--
-- Name: pengajuan_cuti pengajuan_cuti_jenis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan_cuti
    ADD CONSTRAINT pengajuan_cuti_jenis_id_fkey FOREIGN KEY (jenis_id) REFERENCES public.jenis_cuti(id);


--
-- Name: pengajuan_cuti pengajuan_cuti_pengaju_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengajuan_cuti
    ADD CONSTRAINT pengajuan_cuti_pengaju_id_fkey FOREIGN KEY (pengaju_id) REFERENCES public.users(id);


--
-- Name: persetujuan persetujuan_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persetujuan
    ADD CONSTRAINT persetujuan_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: persetujuan persetujuan_pengajuan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persetujuan
    ADD CONSTRAINT persetujuan_pengajuan_id_fkey FOREIGN KEY (pengajuan_id) REFERENCES public.pengajuan_cuti(id) ON DELETE CASCADE;


--
-- Name: users users_divisi_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_divisi_fk FOREIGN KEY (divisi_id) REFERENCES public.divisi(id);


--
-- PostgreSQL database dump complete
--


