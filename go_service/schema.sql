--
-- PostgreSQL database dump
--

\restrict pthyff0bspc7BnhB73UUs1hrckFyfoj7RLanLKmiX46roMEXR5NhxIVrFmeBmdT

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

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
-- Name: workflowtemplatecategory; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public.workflowtemplatecategory AS ENUM (
    'IMAGE_GENERATOR',
    'TEXT_GENERATOR',
    'VIDEO_EDITOR',
    'AUDIO_PROCESSOR',
    'MARKETING',
    'PRODUCTIVITY',
    'DEVELOPMENT',
    'OTHER'
);


ALTER TYPE public.workflowtemplatecategory OWNER TO "user";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.admin (
    username character varying(50) NOT NULL,
    id integer NOT NULL,
    hashed_password character varying(255) NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.admin OWNER TO "user";

--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_id_seq OWNER TO "user";

--
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO "user";

--
-- Name: categories; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.categories (
    original_category character varying NOT NULL,
    id integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO "user";

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO "user";

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: category_translations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.category_translations (
    lang_code character varying NOT NULL,
    display_category character varying NOT NULL,
    id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.category_translations OWNER TO "user";

--
-- Name: category_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.category_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.category_translations_id_seq OWNER TO "user";

--
-- Name: category_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.category_translations_id_seq OWNED BY public.category_translations.id;


--
-- Name: tool_faqs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.tool_faqs (
    lang_code character varying NOT NULL,
    faq_order integer NOT NULL,
    question character varying NOT NULL,
    answer character varying NOT NULL,
    id integer NOT NULL,
    tool_id integer
);


ALTER TABLE public.tool_faqs OWNER TO "user";

--
-- Name: tool_faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.tool_faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tool_faqs_id_seq OWNER TO "user";

--
-- Name: tool_faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.tool_faqs_id_seq OWNED BY public.tool_faqs.id;


--
-- Name: tool_translations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.tool_translations (
    lang_code character varying NOT NULL,
    description character varying NOT NULL,
    short_description character varying NOT NULL,
    category_name character varying NOT NULL,
    features json,
    use_cases json,
    key_differentiators json,
    pricing_details character varying,
    meta_title character varying(60),
    meta_description character varying(160),
    pros json,
    cons json,
    id integer NOT NULL,
    tool_id integer
);


ALTER TABLE public.tool_translations OWNER TO "user";

--
-- Name: tool_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.tool_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tool_translations_id_seq OWNER TO "user";

--
-- Name: tool_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.tool_translations_id_seq OWNED BY public.tool_translations.id;


--
-- Name: tools; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.tools (
    name character varying NOT NULL,
    slug character varying,
    official_link character varying NOT NULL,
    category character varying NOT NULL,
    pricing_model character varying NOT NULL,
    is_featured boolean NOT NULL,
    tags json,
    logo_url character varying,
    rating double precision,
    screenshots json,
    video_url character varying,
    supported_platforms json,
    review_status character varying NOT NULL,
    rejection_reason character varying,
    submitter_id integer,
    submitter_email character varying,
    edit_count integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.tools OWNER TO "user";

--
-- Name: tools_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tools_id_seq OWNER TO "user";

--
-- Name: tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.tools_id_seq OWNED BY public.tools.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    name character varying NOT NULL,
    avatar character varying,
    google_id character varying,
    github_id character varying,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: workflownode; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.workflownode (
    id integer NOT NULL,
    template_id integer,
    "order" integer NOT NULL,
    tool_name character varying NOT NULL,
    description character varying NOT NULL,
    prompt_template character varying NOT NULL
);


ALTER TABLE public.workflownode OWNER TO "user";

--
-- Name: workflownode_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.workflownode_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workflownode_id_seq OWNER TO "user";

--
-- Name: workflownode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.workflownode_id_seq OWNED BY public.workflownode.id;


--
-- Name: workflowtemplate; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.workflowtemplate (
    id integer NOT NULL,
    title character varying NOT NULL,
    description character varying NOT NULL,
    category public.workflowtemplatecategory NOT NULL,
    flow_chart_description character varying NOT NULL,
    status character varying NOT NULL,
    creator_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.workflowtemplate OWNER TO "user";

--
-- Name: workflowtemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.workflowtemplate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workflowtemplate_id_seq OWNER TO "user";

--
-- Name: workflowtemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.workflowtemplate_id_seq OWNED BY public.workflowtemplate.id;


--
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: category_translations id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_translations ALTER COLUMN id SET DEFAULT nextval('public.category_translations_id_seq'::regclass);


--
-- Name: tool_faqs id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tool_faqs ALTER COLUMN id SET DEFAULT nextval('public.tool_faqs_id_seq'::regclass);


--
-- Name: tool_translations id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tool_translations ALTER COLUMN id SET DEFAULT nextval('public.tool_translations_id_seq'::regclass);


--
-- Name: tools id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tools ALTER COLUMN id SET DEFAULT nextval('public.tools_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: workflownode id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workflownode ALTER COLUMN id SET DEFAULT nextval('public.workflownode_id_seq'::regclass);


--
-- Name: workflowtemplate id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workflowtemplate ALTER COLUMN id SET DEFAULT nextval('public.workflowtemplate_id_seq'::regclass);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: category_translations category_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_translations
    ADD CONSTRAINT category_translations_pkey PRIMARY KEY (id);


--
-- Name: tool_faqs tool_faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tool_faqs
    ADD CONSTRAINT tool_faqs_pkey PRIMARY KEY (id);


--
-- Name: tool_translations tool_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tool_translations
    ADD CONSTRAINT tool_translations_pkey PRIMARY KEY (id);


--
-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);


--
-- Name: users users_github_id_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_github_id_key UNIQUE (github_id);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workflownode workflownode_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workflownode
    ADD CONSTRAINT workflownode_pkey PRIMARY KEY (id);


--
-- Name: workflowtemplate workflowtemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workflowtemplate
    ADD CONSTRAINT workflowtemplate_pkey PRIMARY KEY (id);


--
-- Name: ix_admin_username; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX ix_admin_username ON public.admin USING btree (username);


--
-- Name: ix_categories_original_category; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX ix_categories_original_category ON public.categories USING btree (original_category);


--
-- Name: ix_category_translations_category_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_category_translations_category_id ON public.category_translations USING btree (category_id);


--
-- Name: ix_category_translations_lang_code; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_category_translations_lang_code ON public.category_translations USING btree (lang_code);


--
-- Name: ix_tool_faqs_lang_code; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tool_faqs_lang_code ON public.tool_faqs USING btree (lang_code);


--
-- Name: ix_tool_faqs_tool_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tool_faqs_tool_id ON public.tool_faqs USING btree (tool_id);


--
-- Name: ix_tool_translations_category_name; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tool_translations_category_name ON public.tool_translations USING btree (category_name);


--
-- Name: ix_tool_translations_lang_code; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tool_translations_lang_code ON public.tool_translations USING btree (lang_code);


--
-- Name: ix_tool_translations_tool_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tool_translations_tool_id ON public.tool_translations USING btree (tool_id);


--
-- Name: ix_tools_category; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tools_category ON public.tools USING btree (category);


--
-- Name: ix_tools_name; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tools_name ON public.tools USING btree (name);


--
-- Name: ix_tools_review_status; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tools_review_status ON public.tools USING btree (review_status);


--
-- Name: ix_tools_slug; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX ix_tools_slug ON public.tools USING btree (slug);


--
-- Name: ix_tools_submitter_email; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tools_submitter_email ON public.tools USING btree (submitter_email);


--
-- Name: ix_tools_submitter_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_tools_submitter_id ON public.tools USING btree (submitter_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_workflownode_order; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_workflownode_order ON public.workflownode USING btree ("order");


--
-- Name: ix_workflowtemplate_category; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_workflowtemplate_category ON public.workflowtemplate USING btree (category);


--
-- Name: ix_workflowtemplate_status; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_workflowtemplate_status ON public.workflowtemplate USING btree (status);


--
-- Name: ix_workflowtemplate_title; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_workflowtemplate_title ON public.workflowtemplate USING btree (title);


--
-- Name: category_translations category_translations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.category_translations
    ADD CONSTRAINT category_translations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: tool_faqs tool_faqs_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tool_faqs
    ADD CONSTRAINT tool_faqs_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


--
-- Name: tool_translations tool_translations_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tool_translations
    ADD CONSTRAINT tool_translations_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


--
-- Name: tools tools_submitter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_submitter_id_fkey FOREIGN KEY (submitter_id) REFERENCES public.users(id);


--
-- Name: workflownode workflownode_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workflownode
    ADD CONSTRAINT workflownode_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workflowtemplate(id);


--
-- Name: workflowtemplate workflowtemplate_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workflowtemplate
    ADD CONSTRAINT workflowtemplate_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict pthyff0bspc7BnhB73UUs1hrckFyfoj7RLanLKmiX46roMEXR5NhxIVrFmeBmdT

